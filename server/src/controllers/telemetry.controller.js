"use strict";

const ReadEvent = require("../models/ReadEvent");
const { postRepository } = require("../modules/posts/posts.module");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");

/**
 * Record active read seconds for a post (foreground tab telemetry)
 * POST /api/telemetry/read-event
 */
const recordReadEvent = asyncHandler(async (req, res) => {
  const { postId, activeSeconds } = req.body;

  if (!postId) {
    throw new ApiError(400, "postId is required");
  }

  const parsedSeconds = parseInt(activeSeconds, 10);
  if (isNaN(parsedSeconds) || parsedSeconds < 1) {
    throw new ApiError(400, "activeSeconds must be a positive integer");
  }

  const post = await postRepository.findById(postId);
  if (!post || post.status !== "published" || post.moderationStatus === "hidden") {
    throw new ApiError(404, "Published story not found");
  }

  const viewer = req.user || null;
  const viewerWasMember = Boolean(viewer && viewer.membershipStatus === "active");
  const cappedSeconds = Math.min(parsedSeconds, 1800); // 30-minute cap per session

  const event = await ReadEvent.create({
    post: post._id,
    viewer: viewer ? viewer._id : null,
    viewerWasMember,
    activeSeconds: cappedSeconds,
  });

  return sendSuccess(res, 201, { eventId: event._id }, "Read event recorded");
});

module.exports = { recordReadEvent };
