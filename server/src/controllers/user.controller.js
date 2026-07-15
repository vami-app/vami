"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const User = require("../models/User");
const Post = require("../models/Post");

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
  const { name, bio, avatarUrl } = req.body;
  const user = req.user;

  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

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

  if (alreadyFollowing) {
    me.following = me.following.filter((f) => String(f) !== String(target._id));
    target.followers = target.followers.filter((f) => String(f) !== String(me._id));
  } else {
    me.following.push(target._id);
    target.followers.push(me._id);
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

module.exports = {
  getProfile,
  updateMe,
  uploadAvatar,
  toggleFollow,
  getBookmarks,
};
