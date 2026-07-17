"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const User = require("../models/User");
const Post = require("../models/Post");
const Follow = require("../models/Follow");
const Comment = require("../models/Comment");
const { sendEmail } = require("../utils/email");
const { deleteConfirmationEmail } = require("../utils/emailTemplates");
const { signDeleteToken, verifyDeleteToken } = require("../utils/unsubscribeToken");
const env = require("../config/env");
const { streamExport } = require("../utils/exportAccount");

/**
 * GET /api/users/:username — public profile + published post count.
 * @type {import('express').RequestHandler}
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!user) throw new ApiError(404, "User not found");

  const postCount = await Post.countDocuments({ author: user._id, status: "published" });

  let isFollowing = false;
  if (req.user) {
    isFollowing = user.followers.some((f) => String(f) === String(req.user._id));
  }

  const data = user.toPublicJSON(false);
  data.postCount = postCount;
  data.isFollowing = isFollowing;
  data.isSelf = req.user ? String(req.user._id) === String(user._id) : false;

  return sendSuccess(res, 200, { user: data });
});

/**
 * PATCH /api/users/me — update own profile (name, bio, avatarUrl).
 * @type {import('express').RequestHandler}
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, bio, avatarUrl, emailPrefs } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  if (emailPrefs !== undefined) {
    if (!user.emailPrefs) {
      user.emailPrefs = { allEmails: true, digestFrequency: "weekly" };
    }
    if (emailPrefs.allEmails !== undefined) {
      user.emailPrefs.allEmails = Boolean(emailPrefs.allEmails);
    }
    if (emailPrefs.digestFrequency !== undefined) {
      if (!["weekly", "off"].includes(emailPrefs.digestFrequency)) {
        throw new ApiError(400, "Invalid digest frequency option");
      }
      user.emailPrefs.digestFrequency = emailPrefs.digestFrequency;
    }
  }

  await user.save();
  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Profile updated");
});

/**
 * POST /api/users/me/avatar — upload avatar (multipart, field "avatar").
 * @type {import('express').RequestHandler}
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No image uploaded");
  const url = `/uploads/${req.file.filename}`;
  req.user.avatarUrl = url;
  await req.user.save();
  return sendSuccess(res, 200, { avatarUrl: url, user: req.user.toPublicJSON(true) }, "Avatar updated");
});

/**
 * POST /api/users/:username/follow — toggle follow/unfollow.
 * @type {import('express').RequestHandler}
 */
const toggleFollow = asyncHandler(async (req, res) => {
  const target = await User.findOne({ username: req.params.username.toLowerCase() });
  if (!target) throw new ApiError(404, "User not found");
  if (String(target._id) === String(req.user._id)) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const me = req.user;
  const alreadyFollowing = me.following.some((f) => String(f) === String(target._id));
  const sourcePost = req.body.sourcePost || req.query.sourcePost || null;

  if (alreadyFollowing) {
    me.following = me.following.filter((f) => String(f) !== String(target._id));
    target.followers = target.followers.filter((f) => String(f) !== String(me._id));
    await Follow.deleteOne({ follower: me._id, followee: target._id });
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
    await Follow.create({
      follower: me._id,
      followee: target._id,
      sourcePost: sourcePost || null,
    });
  }

  await Promise.all([me.save(), target.save()]);

  return sendSuccess(
    res,
    200,
    { following: !alreadyFollowing, followersCount: target.followers.length },
    alreadyFollowing ? "Unfollowed" : "Following"
  );
});

/**
 * GET /api/users/me/bookmarks — current user's saved (published) stories.
 * @type {import('express').RequestHandler}
 */
const getBookmarks = asyncHandler(async (req, res) => {
  const user = await req.user.populate({
    path: "bookmarks",
    match: { status: "published" },
    populate: { path: "author", select: "name username avatarUrl bio" },
    options: { sort: { _id: -1 } },
  });
  const posts = user.bookmarks
    .filter(Boolean)
    .map((p) => {
      const card = p.toCardJSON(req.user._id);
      card.viewerBookmarked = true;
      return card;
    });
  return sendSuccess(res, 200, { posts });
});

const RESERVED_SUBDOMAINS = [
  "www", "api", "admin", "mail", "app", "blog", "static",
  "cdn", "assets", "help", "support", "status", "dev", "staging"
];

/**
 * POST /api/users/me/export/request
 * Request a full account export. Throttled to 1 per 24 hours.
 * @type {import('express').RequestHandler}
 */
const requestExport = asyncHandler(async (req, res) => {
  const user = req.user;
  const now = new Date();
  
  if (user.exportRequestedAt) {
    const hoursSinceLast = (now - user.exportRequestedAt) / (1000 * 60 * 60);
    if (hoursSinceLast < 24) {
      throw new ApiError(429, "You can only request one export every 24 hours.");
    }
  }

  user.exportRequestedAt = now;
  user.exportStatus = "ready";
  await user.save();

  return sendSuccess(res, 200, { status: "ready" }, "Export ready for download.");
});

/**
 * GET /api/users/me/export/download
 * Download the zipped account export.
 * @type {import('express').RequestHandler}
 */
const downloadExport = asyncHandler(async (req, res) => {
  const user = req.user;

  if (user.exportStatus !== "ready") {
    throw new ApiError(400, "Please request an export before downloading.");
  }

  const posts = await Post.find({ author: user._id });

  res.attachment(`inkwell-export-${user.username}.zip`);
  await streamExport(res, user, posts);
});

/**
 * PATCH /api/users/me/subdomain
 * Claim a unique username subdomain.
 * @type {import('express').RequestHandler}
 */
const updateSubdomain = asyncHandler(async (req, res) => {
  const subdomain = req.body.subdomain.toLowerCase().trim();
  const user = req.user;

  user.subdomain = subdomain;
  await user.save();

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Subdomain updated successfully.");
});

/**
 * POST /api/users/me/delete-request
 * Sends a confirmation email to delete the user account.
 * @type {import('express').RequestHandler}
 */
const requestDeleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  const token = signDeleteToken(String(user._id));

  const deleteUrl = `${env.clientUrl}/settings?deleteToken=${token}`;

  try {
    await sendEmail({
      to: user.email,
      ...deleteConfirmationEmail({
        name: user.name,
        deleteUrl,
        ttlMinutes: 30,
      }),
    });
  } catch (err) {
    console.error("[delete-request] email send failed:", err.message);
    throw new ApiError(500, "Could not send confirmation email. Please try again later.");
  }

  return sendSuccess(res, 200, null, "Confirmation email sent. Please check your inbox.");
});

/**
 * DELETE /api/users/me
 * Permanently deletes or anonymizes the user account.
 * @type {import('express').RequestHandler}
 */
const deleteAccount = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;
  const mode = req.body.mode || req.query.mode;
  if (!token) throw new ApiError(400, "Deletion token is required");
  if (!["erase", "anonymize"].includes(mode)) {
    throw new ApiError(400, "Invalid deletion mode. Choose 'erase' or 'anonymize'.");
  }

  let userId;
  try {
    userId = verifyDeleteToken(token);
  } catch (err) {
    throw new ApiError(400, "Invalid or expired deletion token");
  }

  if (String(userId) !== String(req.user._id)) {
    throw new ApiError(403, "Token does not match the authenticated user");
  }

  const user = req.user;

  // Get deleted user placeholder (needed for anonymization and soft-delete comment reassignments)
  let deletedUser = await User.findOne({ username: "deleted" });
  if (!deletedUser) {
    deletedUser = await User.create({
      name: "Deleted User",
      username: "deleted",
      email: "deleted@inkwell.dev",
      password: "system-placeholder-password-" + require("crypto").randomBytes(8).toString("hex"),
      bio: "This account represents content from deleted authors.",
      emailVerified: true,
    });
  }

  // 1. Capture sets (essential for ordering)
  const postsByUser = await Post.find({ author: user._id }).select("_id");
  const postIds = postsByUser.map((p) => p._id);

  const ownComments = await Comment.find({ author: user._id }).select("_id");
  const ownCommentIds = ownComments.map((c) => c._id);

  const ownPostComments = await Comment.find({ post: { $in: postIds } }).select("_id");
  const commentsOnOwnPosts = ownPostComments.map((c) => c._id);

  const targetCommentIds = [...new Set([...ownCommentIds.map(String), ...commentsOnOwnPosts.map(String)])];

  const Report = require("../models/Report");
  const PostRevision = require("../models/PostRevision");

  if (mode === "erase") {
    // 2. Delete revisions for posts that are going to be deleted
    await PostRevision.deleteMany({ post: { $in: postIds } });

    // 3. Delete own reports (reports submitted by the user)
    await Report.deleteMany({ reporter: user._id });

    // 4. Delete reports targeting the user's posts, their own comments, or comments left on their posts
    await Report.deleteMany({
      $or: [
        { targetType: "post", targetId: { $in: postIds } },
        { targetType: "comment", targetId: { $in: targetCommentIds } }
      ]
    });

    // 5. Delete ALL comments on user's own posts (regardless of author)
    await Comment.deleteMany({ post: { $in: postIds } });

    // 6. Soft or hard delete user's comments on other people's posts
    const otherComments = await Comment.find({ author: user._id, post: { $nin: postIds } });
    for (const comment of otherComments) {
      const hasReplies = await Comment.exists({ parentComment: comment._id });
      if (hasReplies) {
        comment.content = "[deleted]";
        comment.deletedButHasReplies = true;
        comment.author = deletedUser._id; // Reassign to system deleted user
        await comment.save();
      } else {
        await comment.deleteOne();
      }
    }

    // 7. Delete Post docs where author = user
    await Post.deleteMany({ author: user._id });

  } else {
    // Anonymize mode: reassign posts and comments to 'deleted' user
    
    // Reassign PostRevisions' author if they exist
    await PostRevision.updateMany({ editedBy: user._id }, { editedBy: deletedUser._id });

    // Reports: Delete reports submitted by the user
    await Report.deleteMany({ reporter: user._id });

    // Reassign posts and comments
    await Post.updateMany({ author: user._id }, { author: deletedUser._id });
    await Comment.updateMany({ author: user._id }, { author: deletedUser._id });
  }

  // 8. Pull from bookmarks
  if (postIds.length > 0) {
    await User.updateMany(
      { bookmarks: { $in: postIds } },
      { $pull: { bookmarks: { $in: postIds } } }
    );
  }

  // 9. Delete Follow docs both directions + pull legacy arrays
  await Follow.deleteMany({
    $or: [{ follower: user._id }, { followee: user._id }],
  });
  await User.updateMany(
    { followers: user._id },
    { $pull: { followers: user._id } }
  );
  await User.updateMany(
    { following: user._id },
    { $pull: { following: user._id } }
  );

  // 10. Pull claps and recompute totalClaps
  const clappedPosts = await Post.find({ "claps.user": user._id });
  for (const post of clappedPosts) {
    post.claps = post.claps.filter((c) => String(c.user) !== String(user._id));
    post.totalClaps = post.claps.reduce((sum, c) => sum + c.count, 0);
    await post.save();
  }

  // 11. Delete avatar from disk
  if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/")) {
    const fs = require("fs");
    const path = require("path");
    const filePath = path.join(__dirname, "../..", user.avatarUrl);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete avatar file:", err.message);
      }
    }
  }

  // 12. AuditLog preserve is a no-op (explicit no-op is handled by not modifying AuditLog here)

  // 13. Delete User
  await user.deleteOne();

  const { clearAuthCookies } = require("../utils/jwt");
  clearAuthCookies(res);

  return sendSuccess(res, 200, null, "Account deleted successfully.");
});

module.exports = {
  getProfile,
  updateMe,
  uploadAvatar,
  toggleFollow,
  getBookmarks,
  requestExport,
  downloadExport,
  updateSubdomain,
  requestDeleteAccount,
  deleteAccount,
};
