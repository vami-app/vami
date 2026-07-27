"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { ApiError } = require("../../utils/apiResponse");
const { signAccessToken, signRefreshToken } = require("../../utils/jwt");
const User = require("./users.model");
const { sendEmail } = require("../../utils/email");
const {
  verificationEmail,
  passwordResetEmail,
  deleteConfirmationEmail,
} = require("../../utils/emailTemplates");
const { signDeleteToken, verifyDeleteToken } = require("../../utils/unsubscribeToken");
const env = require("../../config/env");
const { disconnectUserSockets } = require("../../config/socket");
const { RESERVED_SLUGS } = require("../../validators/user.validator") || {};

const DEFAULT_RESERVED = [
  "admin",
  "api",
  "pub",
  "settings",
  "auth",
  "feed",
  "lists",
  "user",
  "users",
  "posts",
  "search",
  "tag",
  "tags",
  "dashboard",
  "mine",
  "help",
  "about",
  "explore",
];

class UserService {
  constructor(userRepository) {
    this.users = userRepository;
  }

  /**
   * Helper to generate a 64-char hex SHA256 hash of a raw token.
   */
  hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Auth Domain Operations
  // ─────────────────────────────────────────────────────────────

  async register({ name, username, email, password }) {
    if (!name || !name.trim()) throw new ApiError(400, "Name is required");
    if (!username || !username.trim()) throw new ApiError(400, "Username is required");
    if (!email || !email.trim()) throw new ApiError(400, "Email is required");
    if (!password || password.length < 8) throw new ApiError(400, "Password must be at least 8 characters");

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingEmail = await this.users.findByEmail(cleanEmail);
    if (existingEmail) throw new ApiError(400, "Email is already registered");

    const existingUsername = await this.users.findByUsername(cleanUsername);
    if (existingUsername) throw new ApiError(400, "Username is already taken");

    const user = await this.users.create({
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
    });

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = signRefreshToken(String(user._id));

    // Send verification email asynchronously
    const rawVerifyToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawVerifyToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.users.setVerificationToken({ id: user._id, tokenHash, expiresAt });

    const verifyUrl = `${env.clientUrl}/verify-email?token=${rawVerifyToken}`;
    sendEmail({
      to: user.email,
      ...verificationEmail({ name: user.name, verifyUrl }),
    }).catch((err) => console.error("[register] verification email failed:", err.message));

    return { user, accessToken, refreshToken };
  }

  async login({ email, password }) {
    if (!email || !password) throw new ApiError(400, "Email and password are required");

    const user = await this.users.findByEmail(email, { selectPassword: true });
    if (!user) throw new ApiError(401, "Invalid email or password");

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw new ApiError(401, "Invalid email or password");

    if (user.status === "banned") {
      throw new ApiError(403, "Your account has been deactivated or banned");
    }

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = signRefreshToken(String(user._id));

    return { user, accessToken, refreshToken };
  }

  async refresh({ userId }) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(401, "User no longer exists");
    if (user.status === "banned") {
      throw new ApiError(403, "Your account has been deactivated or banned");
    }

    const accessToken = signAccessToken(String(user._id));
    const refreshToken = signRefreshToken(String(user._id));

    return { user, accessToken, refreshToken };
  }

  async getMe(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  async forgotPassword({ email }) {
    if (!email || !email.trim()) throw new ApiError(400, "Email is required");

    const user = await this.users.findByEmail(email);
    if (!user) {
      // Return success gracefully to prevent email enumeration
      return { message: "If that email is registered, password reset instructions have been sent." };
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour TTL

    await this.users.setResetToken({ id: user._id, tokenHash, expiresAt });

    const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
    sendEmail({
      to: user.email,
      ...passwordResetEmail({ name: user.name, resetUrl, ttlMinutes: 60 }),
    }).catch((err) => console.error("[forgotPassword] email failed:", err.message));

    return { message: "If that email is registered, password reset instructions have been sent." };
  }

  async resetPassword({ token, newPassword }) {
    if (!token) throw new ApiError(400, "Reset token is required");
    if (!newPassword || newPassword.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }

    const tokenHash = this.hashToken(token);
    const user = await this.users.findByValidResetToken(tokenHash);
    if (!user) throw new ApiError(400, "Password reset token is invalid or has expired.");

    await this.users.updatePasswordHash({ id: user._id, hash: newPassword });
    return { message: "Password reset successful. You can now log in with your new password." };
  }

  async verifyEmail({ token }) {
    if (!token) throw new ApiError(400, "Verification token is required");

    const tokenHash = this.hashToken(token);
    const user = await User.findOne({
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      throw new ApiError(400, "Email verification token is invalid or has expired.");
    }

    const updatedUser = await this.users.setEmailVerified(user._id);
    return { user: updatedUser, message: "Email verified successfully." };
  }

  async resendVerification(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");
    if (user.emailVerified) {
      throw new ApiError(400, "Email is already verified.");
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.users.setVerificationToken({ id: user._id, tokenHash, expiresAt });

    const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
    await sendEmail({
      to: user.email,
      ...verificationEmail({ name: user.name, verifyUrl }),
    });

    return { message: "Verification email sent successfully." };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Profile & Users Domain Operations
  // ─────────────────────────────────────────────────────────────

  async getProfile({ username, viewerId }) {
    const cleanUsername = username.toLowerCase().trim();
    const user = await this.users.findByUsername(cleanUsername);
    if (!user) throw new ApiError(404, "User not found");

    const Post = require("../../models/Post");
    const postCount = await Post.countDocuments({ author: user._id, status: "published" });

    let isFollowing = false;
    if (viewerId) {
      isFollowing = user.followers.some((f) => String(f) === String(viewerId));
    }

    return {
      user: user.toPublicJSON(false),
      postCount,
      isFollowing,
    };
  }

  async updateMe({ userId, fields }) {
    const user = await this.users.updateProfile({ id: userId, fields });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  async updateAvatar({ userId, avatarUrl }) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const oldAvatar = user.avatarUrl;
    if (oldAvatar && oldAvatar.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../..", oldAvatar);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete old avatar:", err.message);
        }
      }
    }

    const updatedUser = await this.users.setAvatarUrl({ id: userId, avatarUrl });
    return updatedUser;
  }

  async toggleFollow({ requesterId, targetUsername }) {
    const targetUser = await this.users.findByUsername(targetUsername);
    if (!targetUser) throw new ApiError(404, "User not found");

    if (String(requesterId) === String(targetUser._id)) {
      throw new ApiError(400, "You cannot follow yourself");
    }

    const Follow = require("./follow.model");
    const existing = await Follow.findOne({
      follower: requesterId,
      followee: targetUser._id,
    });

    let isFollowing = false;
    if (existing) {
      await Follow.deleteOne({ _id: existing._id });
      await User.updateOne({ _id: requesterId }, { $pull: { following: targetUser._id } });
      await User.updateOne({ _id: targetUser._id }, { $pull: { followers: requesterId } });
      isFollowing = false;
    } else {
      await Follow.create({ follower: requesterId, followee: targetUser._id });
      await User.updateOne({ _id: requesterId }, { $addToSet: { following: targetUser._id } });
      await User.updateOne({ _id: targetUser._id }, { $addToSet: { followers: requesterId } });
      isFollowing = true;

      // Trigger notification
      const { notificationService } = require("../notifications/notifications.module");
      if (notificationService) {
        notificationService.notifyFollow({
          followee: targetUser._id,
          follower: requesterId,
        }).catch((err) => console.error("[toggleFollow] notification failed:", err.message));
      }
    }

    return { isFollowing, targetUser };
  }

  async getBookmarks(userId) {
    return this.users.findBookmarks(userId);
  }

  async requestExport(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (user.exportStatus === "pending") {
      throw new ApiError(400, "An export request is already in progress.");
    }

    await this.users.setExportStatus({ id: userId, status: "ready", requestedAt: new Date() });
    return { message: "Account data export prepared successfully." };
  }

  async downloadExport({ userId, res }) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const { streamExport } = require("../../utils/exportAccount");
    await streamExport(user, res);
  }

  async updateSubdomain({ userId, subdomain }) {
    if (!subdomain || !subdomain.trim()) {
      throw new ApiError(400, "Subdomain is required.");
    }

    const clean = subdomain.toLowerCase().trim();
    if (clean.length < 3 || clean.length > 30) {
      throw new ApiError(400, "Subdomain must be between 3 and 30 characters.");
    }

    const reservedList = RESERVED_SLUGS || DEFAULT_RESERVED;
    if (reservedList.includes(clean)) {
      throw new ApiError(400, `The subdomain '${clean}' is reserved.`);
    }

    const existingUser = await this.users.findBySubdomain(clean);
    if (existingUser && String(existingUser._id) !== String(userId)) {
      throw new ApiError(400, "This subdomain is already taken.");
    }

    const Publication = require("../../models/Publication");
    const existingPub = await Publication.findOne({ slug: clean });
    if (existingPub) {
      throw new ApiError(400, "This subdomain collides with an existing publication slug.");
    }

    const updatedUser = await this.users.setSubdomain({ id: userId, subdomain: clean });
    return updatedUser;
  }

  async requestDeleteAccount(userId) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

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
    }

    return { message: "Account deletion instructions sent to your email." };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Complete 18-Step Cascade Account Erasure Execution
  // ─────────────────────────────────────────────────────────────

  async deleteAccount({ userId, token, mode, res }) {
    const user = await this.users.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (mode === "archive" || mode === "deactivate") {
      user.status = "banned";
      await user.save();
      disconnectUserSockets(user._id);
      const { clearAuthCookies } = require("../../utils/jwt");
      clearAuthCookies(res);
      return { message: "Account deactivated successfully." };
    }

    if (!token) {
      throw new ApiError(400, "Deletion token is required.");
    }

    try {
      const targetUserId = verifyDeleteToken(token);
      if (String(targetUserId) !== String(user._id)) {
        throw new ApiError(403, "Invalid deletion token.");
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(403, "Invalid or expired deletion token.");
    }

    // Get deleted user placeholder
    const User = require("../../models/User");
    let deletedUser = await User.findOne({ username: "deleted" });
    if (!deletedUser) {
      deletedUser = await User.create({
        name: "Deleted User",
        username: "deleted",
        email: "deleted@inkwell.dev",
        password: "system-placeholder-password-" + crypto.randomBytes(8).toString("hex"),
        bio: "This account represents content from deleted authors.",
        emailVerified: true,
      });
    }

    // Capture sets
    const { postRepository } = require("../posts/posts.module");
    const Comment = require("../../models/Comment");
    const Report = require("../moderation/report.model");
    const ReadEvent = require("../../models/ReadEvent");
    const Follow = require("./follow.model");

    const postIds = await postRepository.findIdsByAuthor(user._id);

    const ownComments = await Comment.find({ author: user._id }).select("_id");
    const ownCommentIds = ownComments.map((c) => c._id);

    const ownPostComments = await Comment.find({ post: { $in: postIds } }).select("_id");
    const commentsOnOwnPosts = ownPostComments.map((c) => c._id);

    const targetCommentIds = [...new Set([...ownCommentIds.map(String), ...commentsOnOwnPosts.map(String)])];

    const { highlightRepository } = require("../highlights/highlights.module");
    const { postRevisionRepository } = require("../post-revisions/post-revisions.module");
    const { commentRepository } = require("../comments/comments.module");
    const { disputeRepository } = require("../moderation/moderation.module");

    if (mode === "erase") {
      await disputeRepository.voidForUser(user._id);
      await highlightRepository.deleteManyByPostIds(postIds);
      await postRevisionRepository.deleteManyByPostIds(postIds);
      await Report.deleteMany({ reporter: user._id });
      await Report.deleteMany({
        $or: [
          { targetType: "post", targetId: { $in: postIds } },
          { targetType: "comment", targetId: { $in: targetCommentIds } },
        ],
      });

      await commentRepository.deleteManyByPostIds(postIds);

      const otherComments = await commentRepository.findOtherCommentsByAuthor(user._id, postIds);
      for (const comment of otherComments) {
        const hasReplies = await commentRepository.hasReplies(comment._id);
        if (hasReplies) {
          await commentRepository.anonymizeAndSoftDelete(comment._id, deletedUser._id);
        } else {
          await commentRepository.hardDelete(comment._id);
        }
      }

      await postRepository.deleteManyByAuthor(user._id);
    } else {
      const PostRevision = require("../../models/PostRevision");
      await PostRevision.updateMany({ editedBy: user._id }, { editedBy: deletedUser._id });
      await Report.deleteMany({ reporter: user._id });
      const Post = require("../posts/posts.model");
      await Post.updateMany({ author: user._id }, { author: deletedUser._id });
      await Comment.updateMany({ author: user._id }, { author: deletedUser._id });
    }

    // Step 8: Pull from bookmarks across users
    if (postIds.length > 0) {
      await this.users.removeFromAllBookmarks(postIds);
    }

    // Step 9: Delete Follow docs both directions + pull legacy arrays
    await Follow.deleteMany({
      $or: [{ follower: user._id }, { followee: user._id }],
    });
    await this.users.pullFollowReferences(user._id);

    // Step 10: Pull claps and recompute totalClaps
    await postRepository.findByClapperAndRecompute(user._id);

    // Step 11: Delete avatar from disk
    if (user.avatarUrl && user.avatarUrl.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "../..", user.avatarUrl);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete avatar file:", err.message);
        }
      }
    }

    // Step 12: Reading lists owned by user
    const { readingListRepository } = require("../reading-lists/reading-lists.module");
    await readingListRepository.deleteManyByOwner(user._id);

    // Step 13: Publication memberships & owner transfer / archival
    const { publicationRepository, publicationMemberRepository } = require("../publications/publications.module");
    const userMemberships = await publicationMemberRepository.findByUser(user._id);
    for (const m of userMemberships) {
      const pubId = m.publication ? (m.publication._id || m.publication) : null;
      if (!pubId) continue;
      if (m.role === "owner") {
        const otherOwners = await publicationMemberRepository.countOwners(pubId, user._id);
        if (otherOwners === 0) {
          const nextSenior = await publicationMemberRepository.findSeniorMember(pubId, user._id);
          if (nextSenior) {
            await publicationMemberRepository.updateRole({
              publicationId: pubId,
              userId: nextSenior.user,
              role: "owner",
            });
            await publicationRepository.updateOwner(pubId, nextSenior.user);
          } else {
            await publicationRepository.archive(pubId);
          }
        }
      }
    }
    await publicationMemberRepository.deleteManyByUser(user._id);

    // Step 14: Delete viewer ReadEvents
    await ReadEvent.deleteMany({ viewer: user._id });

    // Step 15: Membership status canceled
    if (user.razorpaySubscriptionId || user.membershipStatus === "active") {
      await this.users.updateMembershipStatus(user._id, "canceled");
    }

    // Step 16: Notifications Cleanup
    const { notificationRepository } = require("../notifications/notifications.module");
    await notificationRepository.deleteManyByRecipient(user._id);

    const softDeletedComments = await Comment.find({ deletedButHasReplies: true }).select("_id");
    const softDeletedCommentIds = softDeletedComments.map((c) => c._id);
    await notificationRepository.deleteActorNotifsExceptSoftDeletedComments({
      actorId: user._id,
      softDeletedCommentIds,
    });

    // Step 17: Highlights owned by user
    await highlightRepository.deleteManyByOwner(user._id);

    // Step 18: Delete User
    await this.users.deleteById(user._id);
    disconnectUserSockets(user._id);

    const { clearAuthCookies } = require("../../utils/jwt");
    clearAuthCookies(res);

    return { message: "Account deleted successfully." };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Admin Domain Operations
  // ─────────────────────────────────────────────────────────────

  async listUsers({ cursor, limit = 20, search = "" }) {
    const data = await this.users.findPaginated({ cursor, limit, search });
    const formattedUsers = data.users.map((u) => u.toPublicJSON(true));
    return { users: formattedUsers, nextCursor: data.nextCursor, hasMore: data.hasMore };
  }

  async updateUserRole({ userId, role }) {
    if (!["user", "admin"].includes(role)) {
      throw new ApiError(400, "Invalid role. Must be 'user' or 'admin'");
    }
    const user = await this.users.setRole({ id: userId, role });
    if (!user) throw new ApiError(404, "User not found");
    return user;
  }

  async updateUserBan({ userId, banned }) {
    const user = await this.users.setBanned({ id: userId, banned });
    if (!user) throw new ApiError(404, "User not found");

    if (banned) {
      disconnectUserSockets(userId);
    }
    return user;
  }

  // ─────────────────────────────────────────────────────────────
  // 5. OAuth Account Creation / Linking Callback
  // ─────────────────────────────────────────────────────────────

  async handleOAuthLogin({ provider, providerId, email, name, avatarUrl }) {
    if (!email) {
      throw new Error("OAuth provider must provide a valid email");
    }

    // 1. Existing OAuth match
    let user = await this.users.findByOAuthId({ provider, providerId });
    if (user) return user;

    // 2. Account linking via email match
    user = await this.users.findByEmail(email);
    if (user) {
      await this.users.linkOAuthId({ id: user._id, provider, providerId });
      return user;
    }

    // 3. Create new OAuth user
    const baseUsername = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase() || "user";
    let username = baseUsername;
    let counter = 1;
    while (await this.users.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    const oauthData = {
      name: name || username,
      username,
      email,
      emailVerified: true,
      avatarUrl: avatarUrl || "",
    };
    if (provider === "google") oauthData.googleId = providerId;
    if (provider === "github") oauthData.githubId = providerId;

    user = await this.users.create(oauthData);
    return user;
  }
}

module.exports = UserService;
