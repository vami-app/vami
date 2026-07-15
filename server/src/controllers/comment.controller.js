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
  return {
    id: c._id,
    content: c.content,
    author: c.author && c.author.username
      ? {
          id: c.author._id,
          name: c.author.name,
          username: c.author.username,
          avatarUrl: c.author.avatarUrl,
        }
      : c.author,
    createdAt: c.createdAt,
  };
}

/**
 * GET /api/posts/:slug/comments — flat list, newest first.
 * @type {import('express').RequestHandler}
 */
const listComments = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id");
  if (!post) throw new ApiError(404, "Story not found");

  const comments = await Comment.find({ post: post._id })
    .sort({ _id: -1 })
    .populate("author", AUTHOR_FIELDS);

  return sendSuccess(res, 200, { comments: comments.map(commentJSON) });
});

/**
 * POST /api/posts/:slug/comments — add a response.
 * @type {import('express').RequestHandler}
 */
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id status");
  if (!post) throw new ApiError(404, "Story not found");

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    content: req.body.content,
  });
  await comment.populate("author", AUTHOR_FIELDS);

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
  await comment.deleteOne();
  return sendSuccess(res, 200, null, "Comment deleted");
});

module.exports = { listComments, addComment, deleteComment };
