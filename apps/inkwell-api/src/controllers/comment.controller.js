"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

const AUTHOR_FIELDS = "name username avatarUrl";

/**
 * Shape a comment for API output.
 * @param {*} c - populated comment doc
 * @returns {Object}
 */
function commentJSON(c) {
  const isSoftDeleted = c.deletedButHasReplies;
  return {
    id: c._id,
    content: isSoftDeleted ? "[deleted]" : c.content,
    author: isSoftDeleted
      ? {
          id: null,
          name: "Deleted User",
          username: "deleted",
          avatarUrl: "",
        }
      : (c.author && c.author.username
          ? {
              id: c.author._id,
              name: c.author.name,
              username: c.author.username,
              avatarUrl: c.author.avatarUrl,
            }
          : c.author),
    parentComment: c.parentComment || null,
    depth: c.depth || 0,
    deletedButHasReplies: isSoftDeleted,
    moderationStatus: c.moderationStatus || "visible",
    createdAt: c.createdAt,
  };
}

/**
 * GET /api/posts/:slug/comments — flat list, chronological.
 * @type {import('express').RequestHandler}
 */
const listComments = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id status author");
  if (!post) throw new ApiError(404, "Story not found");

  const viewerId = req.user ? req.user._id : null;
  const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

  // Sort chronological (oldest first) so that parent comments are processed before children on client
  const comments = await Comment.find({ post: post._id, moderationStatus: "visible" })
    .sort({ createdAt: 1 })
    .populate("author", AUTHOR_FIELDS);

  return sendSuccess(res, 200, { comments: comments.map(commentJSON) });
});

/**
 * POST /api/posts/:slug/comments — add a response.
 * @type {import('express').RequestHandler}
 */
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id status author");
  if (!post) throw new ApiError(404, "Story not found");

  const viewerId = req.user ? req.user._id : null;
  const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

  const { content, parentComment } = req.body;
  let depth = 0;
  let parentId = null;

  if (parentComment) {
    const parent = await Comment.findById(parentComment);
    if (!parent) {
      throw new ApiError(404, "Parent comment not found");
    }
    if (String(parent.post) !== String(post._id)) {
      throw new ApiError(400, "Parent comment does not belong to this story");
    }
    parentId = parent._id;
    depth = Math.min((parent.depth || 0) + 1, 5); // Clamped to max depth of 5
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    content: content,
    parentComment: parentId,
    depth: depth,
  });
  await comment.populate("author", AUTHOR_FIELDS);

  // Notification triggers for comment / reply
  const Notification = require("../models/Notification");
  const { emitNotificationToUser } = require("../config/socket");

  const recipientsNotified = new Set();

  // 1. Notify Post Author (comment)
  if (String(req.user._id) !== String(post.author)) {
    const notif = await Notification.create({
      recipient: post.author,
      actor: req.user._id,
      type: parentId ? "reply" : "comment",
      targetType: "post",
      targetId: post._id,
    });
    recipientsNotified.add(String(post.author));
    const populatedNotif = await Notification.findById(notif._id).populate("actor", "name username avatarUrl").lean();
    emitNotificationToUser(post.author, populatedNotif);
  }

  // 2. Notify Parent Comment Author (reply) if applicable and not already notified
  if (parentId) {
    const parent = await Comment.findById(parentId);
    if (parent && String(req.user._id) !== String(parent.author) && !recipientsNotified.has(String(parent.author))) {
      const notif = await Notification.create({
        recipient: parent.author,
        actor: req.user._id,
        type: "reply",
        targetType: "comment",
        targetId: parent._id,
      });
      const populatedNotif = await Notification.findById(notif._id).populate("actor", "name username avatarUrl").lean();
      emitNotificationToUser(parent.author, populatedNotif);
    }
  }

  return sendSuccess(res, 201, { comment: commentJSON(comment) }, "Response added");
});

/**
 * DELETE /api/comments/:id — delete own comment.
 * @type {import('express').RequestHandler}
 */
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) throw new ApiError(404, "Comment not found");
  if (String(comment.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only delete your own comments");
  }

  // If this comment has replies, soft-delete it. Otherwise, hard-delete it.
  const hasReplies = await Comment.exists({ parentComment: comment._id });
  if (hasReplies) {
    comment.content = "[deleted]";
    comment.deletedButHasReplies = true;
    await comment.save();
    return sendSuccess(res, 200, { comment: commentJSON(comment) }, "Comment soft-deleted");
  } else {
    await comment.deleteOne();
    return sendSuccess(res, 200, null, "Comment deleted");
  }
});

module.exports = { listComments, addComment, deleteComment };
