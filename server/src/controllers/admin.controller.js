"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");
const mongoose = require("mongoose");

/**
 * GET /api/admin/reports
 * Paginated reports review queue. Sorted by priorityFlag desc, then createdAt desc.
 * @type {import('express').RequestHandler}
 */
const listReports = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
  const skip = (page - 1) * limit;

  const { status } = req.query;
  const filter = {};
  if (status) {
    filter.status = status;
  }

  const totalReports = await Report.countDocuments(filter);
  const reports = await Report.find(filter)
    .sort({ priorityFlag: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("reporter", "name username avatarUrl");

  const reportsWithTargets = [];
  for (const report of reports) {
    let target = null;
    if (report.targetType === "post") {
      target = await Post.findById(report.targetId).populate("author", "name username avatarUrl");
    } else if (report.targetType === "comment") {
      target = await Comment.findById(report.targetId)
        .populate("author", "name username avatarUrl")
        .populate({ path: "post", select: "slug title" });
    }

    const reportObj = report.toObject();
    reportObj.target = target;
    reportsWithTargets.push(reportObj);
  }

  return sendSuccess(res, 200, {
    reports: reportsWithTargets,
    pagination: {
      total: totalReports,
      page,
      limit,
      pages: Math.ceil(totalReports / limit),
    },
  });
});

/**
 * PATCH /api/admin/reports/:id
 * Action or dismiss a report.
 * @type {import('express').RequestHandler}
 */
const resolveReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || !["dismissed", "actioned"].includes(status)) {
    throw new ApiError(400, "Invalid status. Must be 'dismissed' or 'actioned'.");
  }

  const report = await Report.findById(id);
  if (!report) {
    throw new ApiError(404, "Report not found.");
  }

  // Actioning: hide the target content
  if (status === "actioned") {
    if (report.targetType === "post") {
      const post = await Post.findById(report.targetId);
      if (post) {
        post.moderationStatus = "hidden";
        // saving will auto-set indexable = false and notifiedAt = null
        await post.save();
      }
    } else if (report.targetType === "comment") {
      await Comment.updateOne(
        { _id: report.targetId },
        { moderationStatus: "hidden" }
      );
    }

    // Resolve this and all other pending reports for the same target
    await Report.updateMany(
      { targetType: report.targetType, targetId: report.targetId, status: "pending" },
      { status: "actioned" }
    );

    // Audit log
    await AuditLog.create({
      actor: req.user._id,
      action: report.targetType === "post" ? "post_hidden" : "comment_hidden",
      targetType: report.targetType,
      targetId: report.targetId,
    });
  } else {
    // Dismissing
    await Report.updateMany(
      { targetType: report.targetType, targetId: report.targetId, status: "pending" },
      { status: "dismissed" }
    );

    await AuditLog.create({
      actor: req.user._id,
      action: "report_dismissed",
      targetType: "report",
      targetId: report._id,
    });
  }

  // Fetch updated report to return
  const updatedReport = await Report.findById(id);
  return sendSuccess(res, 200, { report: updatedReport }, `Report resolved as ${status}.`);
});

/**
 * PATCH /api/admin/posts/:id/unhide
 * Unhide a moderated post.
 * @type {import('express').RequestHandler}
 */
const unhidePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id);
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  post.moderationStatus = "visible";
  await post.save(); // pre-save hook handles indexable recomputation

  await AuditLog.create({
    actor: req.user._id,
    action: "post_unhidden",
    targetType: "post",
    targetId: post._id,
  });

  return sendSuccess(res, 200, { post: post.toCardJSON() }, "Post unhidden successfully.");
});

/**
 * PATCH /api/admin/comments/:id/unhide
 * Unhide a moderated comment.
 * @type {import('express').RequestHandler}
 */
const unhideComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }

  comment.moderationStatus = "visible";
  await comment.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "comment_unhidden",
    targetType: "comment",
    targetId: comment._id,
  });

  return sendSuccess(res, 200, { comment }, "Comment unhidden successfully.");
});

/**
 * GET /api/admin/users
 * Paginated list of users with search, post counts, roles, and status.
 * @type {import('express').RequestHandler}
 */
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(Math.max(1, parseInt(req.query.limit, 10) || 10), 100);
  const skip = (page - 1) * limit;

  const { search } = req.query;
  const filter = {};

  if (search) {
    const searchRegex = new RegExp(String(search).trim(), "i");
    filter.$or = [
      { name: searchRegex },
      { username: searchRegex },
      { email: searchRegex },
    ];
  }

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const usersWithStats = [];
  for (const u of users) {
    const postCount = await Post.countDocuments({ author: u._id });
    const userObj = u.toPublicJSON(true); // Include email & role
    userObj.postCount = postCount;
    usersWithStats.push(userObj);
  }

  return sendSuccess(res, 200, {
    users: usersWithStats,
    pagination: {
      total: totalUsers,
      page,
      limit,
      pages: Math.ceil(totalUsers / limit),
    },
  });
});

/**
 * PATCH /api/admin/users/:id/ban
 * Ban a user.
 * @type {import('express').RequestHandler}
 */
const banUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Prevent banning the last admin
  if (user.role === "admin") {
    const adminCount = await User.countDocuments({ role: "admin", status: "active" });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot ban the only remaining active admin account.");
    }
  }

  user.status = "banned";
  await user.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "user_banned",
    targetType: "user",
    targetId: user._id,
  });

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User banned successfully.");
});

/**
 * PATCH /api/admin/users/:id/unban
 * Unban a user.
 * @type {import('express').RequestHandler}
 */
const unbanUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  user.status = "active";
  await user.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "user_unbanned",
    targetType: "user",
    targetId: user._id,
  });

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User unbanned successfully.");
});

/**
 * PATCH /api/admin/users/:id/role
 * Update user role.
 * @type {import('express').RequestHandler}
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role || !["user", "admin"].includes(role)) {
    throw new ApiError(400, "Invalid role. Must be 'user' or 'admin'.");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const previousRole = user.role;
  if (previousRole === role) {
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User role is already correct.");
  }

  // Prevent lockout if demoting the last active admin
  if (previousRole === "admin" && role === "user") {
    const adminCount = await User.countDocuments({ role: "admin", status: "active" });
    if (adminCount <= 1) {
      throw new ApiError(400, "Cannot demote the only remaining active admin account.");
    }
  }

  user.role = role;
  await user.save();

  await AuditLog.create({
    actor: req.user._id,
    action: "role_changed",
    targetType: "user",
    targetId: user._id,
    metadata: { previousRole, newRole: role },
  });

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, `User role updated to ${role}.`);
});

/**
 * GET /api/admin/stats
 * Aggregated moderation stats and site metrics.
 * @type {import('express').RequestHandler}
 */
const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  
  const draftPosts = await Post.countDocuments({ status: "draft" });
  const publishedPosts = await Post.countDocuments({ status: "published" });
  const hiddenPosts = await Post.countDocuments({ moderationStatus: "hidden" });

  const pendingReports = await Report.countDocuments({ status: "pending" });
  const actionedReports = await Report.countDocuments({ status: "actioned" });
  const dismissedReports = await Report.countDocuments({ status: "dismissed" });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const signupsAgg = await User.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const postsAgg = await Post.aggregate([
    { $match: { createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return sendSuccess(res, 200, {
    stats: {
      users: {
        total: totalUsers,
      },
      posts: {
        draft: draftPosts,
        published: publishedPosts,
        hidden: hiddenPosts,
      },
      reports: {
        pending: pendingReports,
        actioned: actionedReports,
        dismissed: dismissedReports,
      },
      historical30Days: {
        signups: signupsAgg,
        posts: postsAgg,
      },
    },
  });
});

module.exports = {
  listReports,
  resolveReport,
  unhidePost,
  unhideComment,
  listUsers,
  banUser,
  unbanUser,
  updateUserRole,
  getStats,
};
