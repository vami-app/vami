"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const Report = require("../models/Report");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

/**
 * POST /api/reports
 * Create a report against a post or comment.
 * @type {import('express').RequestHandler}
 */
const createReport = asyncHandler(async (req, res) => {
  const { targetType, targetId, reason, details } = req.body;

  if (!targetType || !["post", "comment"].includes(targetType)) {
    throw new ApiError(400, "Invalid target type. Must be 'post' or 'comment'.");
  }

  if (!targetId) {
    throw new ApiError(400, "Target ID is required.");
  }

  if (!reason || !["spam", "harassment", "misinformation", "other"].includes(reason)) {
    throw new ApiError(400, "Invalid reason.");
  }

  const reporterId = req.user._id;

  // 1. Check if target exists and prevent self-reporting
  let targetExists = false;
  let targetAuthorId = null;

  if (targetType === "post") {
    const post = await Post.findById(targetId);
    if (post) {
      targetExists = true;
      targetAuthorId = post.author;
    }
  } else {
    const comment = await Comment.findById(targetId);
    if (comment) {
      targetExists = true;
      targetAuthorId = comment.author;
    }
  }

  if (!targetExists) {
    throw new ApiError(404, "Reported content not found.");
  }

  if (String(targetAuthorId) === String(reporterId)) {
    throw new ApiError(400, "You cannot report your own content.");
  }

  // 2. Create the report (check for duplicates via MongoDB unique index)
  let report;
  try {
    report = await Report.create({
      reporter: reporterId,
      targetType,
      targetId,
      reason,
      details: details ? String(details).trim().slice(0, 500) : "",
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, "You have already reported this content.");
    }
    throw err;
  }

  // 3. Auto-flag priority if target has 3+ pending reports
  const pendingCount = await Report.countDocuments({
    targetType,
    targetId,
    status: "pending",
  });

  if (pendingCount >= 3) {
    await Report.updateMany(
      { targetType, targetId, status: "pending" },
      { priorityFlag: true }
    );
    // Sync priorityFlag on the newly created report in memory
    report.priorityFlag = true;
  }

  return sendSuccess(res, 201, { report }, "Report submitted successfully.");
});

module.exports = {
  createReport,
};
