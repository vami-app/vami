"use strict";

const Highlight = require("../models/Highlight");
const Post = require("../models/Post");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { canReadFull } = require("../utils/entitlement");

/**
 * POST /api/posts/:slug/highlights
 * Create a new highlight / annotation on a post.
 * PAYWALL LEAK GUARD: Checks canReadFull(post, viewer) before creating highlight.
 */
const createHighlight = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { quote, contextBefore, contextAfter, note } = req.body;

  if (!quote || typeof quote !== "string" || !quote.trim()) {
    throw new ApiError(400, "Highlight quote is required");
  }

  const post = await Post.findOne({ slug });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  // Paywall leak vector guard: require viewer to be entitled to read full post
  if (!canReadFull(post, req.user)) {
    throw new ApiError(403, "You must be an active subscriber or author to highlight locked stories");
  }

  const highlight = await Highlight.create({
    owner: req.user._id,
    post: post._id,
    quote: quote.trim(),
    contextBefore: contextBefore || "",
    contextAfter: contextAfter || "",
    note: note ? note.trim() : "",
  });

  return sendSuccess(res, 201, { highlight }, "Highlight created");
});

/**
 * GET /api/posts/:slug/highlights/mine
 * Get caller's own highlights for a post.
 */
const getPostHighlights = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const post = await Post.findOne({ slug });
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const highlights = await Highlight.find({
    post: post._id,
    owner: req.user._id,
  }).sort({ createdAt: 1 });

  return sendSuccess(res, 200, { highlights }, "Highlights retrieved");
});

/**
 * PATCH /api/highlights/:id
 * Edit note on an existing highlight.
 */
const updateHighlight = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  const highlight = await Highlight.findById(id);
  if (!highlight) {
    throw new ApiError(404, "Highlight not found");
  }

  if (String(highlight.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to update this highlight");
  }

  if (note !== undefined) {
    highlight.note = String(note).trim();
  }

  await highlight.save();
  return sendSuccess(res, 200, { highlight }, "Highlight updated");
});

/**
 * DELETE /api/highlights/:id
 * Delete a highlight.
 */
const deleteHighlight = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const highlight = await Highlight.findById(id);
  if (!highlight) {
    throw new ApiError(404, "Highlight not found");
  }

  if (String(highlight.owner) !== String(req.user._id)) {
    throw new ApiError(403, "Not authorized to delete this highlight");
  }

  await highlight.deleteOne();
  return sendSuccess(res, 200, null, "Highlight deleted");
});

module.exports = {
  createHighlight,
  getPostHighlights,
  updateHighlight,
  deleteHighlight,
};
