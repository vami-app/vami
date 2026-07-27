"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { postRepository } = require("../modules/posts/posts.module");
const User = require("../models/User");
const Comment = require("../models/Comment");
const Report = require("../models/Report");
const AuditLog = require("../models/AuditLog");

/**
 * GET /api/admin/reports
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
      target = await postRepository.findForAdmin(report.targetId);
      if (target) await target.populate("author", "name username avatarUrl");
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

  if (status === "actioned") {
    if (report.targetType === "post") {
      await postRepository.setModerationVisibility({ id: report.targetId, hidden: true });
    } else if (report.targetType === "comment") {
      await Comment.updateOne(
        { _id: report.targetId },
        { moderationStatus: "hidden" }
      );
    }

    await Report.updateMany(
      { targetType: report.targetType, targetId: report.targetId, status: "pending" },
      { status: "actioned" }
    );

    await AuditLog.create({
      actor: req.user._id,
      action: report.targetType === "post" ? "post_hidden" : "comment_hidden",
      targetType: report.targetType,
      targetId: report.targetId,
    });
  } else {
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

  const updatedReport = await Report.findById(id);
  return sendSuccess(res, 200, { report: updatedReport }, `Report resolved as ${status}.`);
});

/**
 * PATCH /api/admin/posts/:id/unhide
 */
const unhidePost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const post = await postRepository.setModerationVisibility({ id, hidden: false });
  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

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
 * GET /api/admin/stats
 */
const getStats = asyncHandler(async (req, res) => {
  const Post = require("../modules/posts/posts.model");
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
    { $match: { status: "published", createdAt: { $gte: thirtyDaysAgo } } },
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
  getStats,
};
