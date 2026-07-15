"use strict";

const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { makeSlug } = require("../utils/slugify");
const { sanitizeContent } = require("../utils/sanitize");
const Post = require("../models/Post");
const User = require("../models/User");

const AUTHOR_FIELDS = "name username avatarUrl bio";
const MAX_CLAPS_PER_USER = 50;

/**
 * Normalize an incoming tags value into a clean lowercase string array.
 * @param {*} tags
 * @returns {string[]}
 */
function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return [
    ...new Set(
      tags
        .map((t) => String(t).trim().toLowerCase())
        .filter((t) => t.length > 0 && t.length <= 30)
    ),
  ].slice(0, 5);
}

/**
 * GET /api/posts — feed with cursor pagination + filters.
 * Query: cursor (post id), limit, tag, author (username), q (search), status.
 * @type {import('express').RequestHandler}
 */
const listPosts = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  const { cursor, tag, author, q, status } = req.query;

  /** @type {Record<string, any>} */
  const filter = {};

  // Only authors may browse their own drafts; the public feed is published-only.
  const wantDrafts = status === "draft" || status === "all";
  if (wantDrafts && author && req.user) {
    const authorUser = await User.findOne({ username: String(author).toLowerCase() });
    if (authorUser && String(authorUser._id) === String(req.user._id)) {
      if (status === "draft") filter.status = "draft";
      // status === 'all' → no status filter (their drafts + published)
      filter.author = authorUser._id;
    } else {
      filter.status = "published";
      if (authorUser) filter.author = authorUser._id;
    }
  } else {
    filter.status = "published";
    if (author) {
      const authorUser = await User.findOne({ username: String(author).toLowerCase() });
      if (!authorUser) return sendSuccess(res, 200, { posts: [], nextCursor: null });
      filter.author = authorUser._id;
    }
  }

  if (tag) filter.tags = String(tag).toLowerCase();
  if (q) filter.$text = { $search: String(q) };

  // Cursor pagination by _id (descending → newest first)
  if (cursor && mongoose.isValidObjectId(cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const docs = await Post.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate("author", AUTHOR_FIELDS);

  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  const nextCursor = hasMore ? String(page[page.length - 1]._id) : null;

  const viewerId = req.user ? req.user._id : null;
  const posts = page.map((p) => p.toCardJSON(viewerId));

  return sendSuccess(res, 200, { posts, nextCursor });
});

/**
 * GET /api/posts/:slug — single post; increments views for published posts.
 * @type {import('express').RequestHandler}
 */
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).populate("author", AUTHOR_FIELDS);
  if (!post) throw new ApiError(404, "Story not found");

  const viewerId = req.user ? req.user._id : null;
  const isAuthor = viewerId && String(post.author._id) === String(viewerId);

  // Drafts are visible only to their author
  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

  // Count a view only for published stories and not for the author's own reads
  if (post.status === "published" && !isAuthor) {
    post.views += 1;
    await post.save();
  }

  const data = post.toCardJSON(viewerId);
  data.contentHtml = post.contentHtml;

  let bookmarked = false;
  if (req.user) {
    bookmarked = req.user.bookmarks.some((b) => String(b) === String(post._id));
  }
  data.viewerBookmarked = bookmarked;

  return sendSuccess(res, 200, { post: data });
});

/**
 * POST /api/posts — create a draft (or publish immediately if status=published).
 * @type {import('express').RequestHandler}
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, subtitle, contentHtml, coverImage, tags, status } = req.body;

  const post = new Post({
    title,
    subtitle: subtitle || "",
    slug: makeSlug(title),
    contentHtml: sanitizeContent(contentHtml || "<p></p>"),
    coverImage: coverImage || "",
    tags: normalizeTags(tags),
    author: req.user._id,
    status: status === "published" ? "published" : "draft",
  });
  if (post.status === "published") post.publishedAt = new Date();

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);
  return sendSuccess(res, 201, { post: post.toCardJSON(req.user._id) }, "Story saved");
});

/**
 * PATCH /api/posts/:slug — edit / change status (author only).
 * @type {import('express').RequestHandler}
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) throw new ApiError(404, "Story not found");
  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only edit your own stories");
  }

  const { title, subtitle, contentHtml, coverImage, tags, status } = req.body;

  if (title !== undefined) post.title = title;
  if (subtitle !== undefined) post.subtitle = subtitle;
  if (contentHtml !== undefined) post.contentHtml = sanitizeContent(contentHtml);
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (tags !== undefined) post.tags = normalizeTags(tags);

  if (status !== undefined && status !== post.status) {
    post.status = status;
    if (status === "published" && !post.publishedAt) post.publishedAt = new Date();
  }

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);
  return sendSuccess(res, 200, { post: post.toCardJSON(req.user._id) }, "Story updated");
});

/**
 * DELETE /api/posts/:slug — delete (author only).
 * @type {import('express').RequestHandler}
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) throw new ApiError(404, "Story not found");
  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only delete your own stories");
  }
  await post.deleteOne();
  // Best-effort: remove from users' bookmarks
  await User.updateMany({ bookmarks: post._id }, { $pull: { bookmarks: post._id } });
  return sendSuccess(res, 200, null, "Story deleted");
});

/**
 * POST /api/posts/:slug/clap — multi-clap, capped at 50 per user.
 * @type {import('express').RequestHandler}
 */
const clapPost = asyncHandler(async (req, res) => {
  const inc = Math.max(1, Math.min(parseInt(req.body.count, 10) || 1, MAX_CLAPS_PER_USER));
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) throw new ApiError(404, "Story not found");
  if (post.status !== "published") throw new ApiError(400, "Cannot clap an unpublished story");

  let entry = post.claps.find((c) => String(c.user) === String(req.user._id));
  if (!entry) {
    entry = { user: req.user._id, count: 0 };
    post.claps.push(entry);
    entry = post.claps[post.claps.length - 1];
  }

  const previous = entry.count;
  entry.count = Math.min(MAX_CLAPS_PER_USER, previous + inc);
  const applied = entry.count - previous;
  post.totalClaps += applied;

  await post.save();
  return sendSuccess(
    res,
    200,
    {
      totalClaps: post.totalClaps,
      viewerClapCount: entry.count,
      capped: entry.count >= MAX_CLAPS_PER_USER,
    },
    applied > 0 ? "Clapped" : "Clap cap reached"
  );
});

/**
 * POST /api/posts/:slug/bookmark — toggle bookmark for the current user.
 * @type {import('express').RequestHandler}
 */
const toggleBookmark = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id status");
  if (!post) throw new ApiError(404, "Story not found");

  const user = req.user;
  const idx = user.bookmarks.findIndex((b) => String(b) === String(post._id));
  let bookmarked;
  if (idx >= 0) {
    user.bookmarks.splice(idx, 1);
    bookmarked = false;
  } else {
    user.bookmarks.push(post._id);
    bookmarked = true;
  }
  await user.save();
  return sendSuccess(res, 200, { bookmarked }, bookmarked ? "Saved" : "Removed");
});

/**
 * GET /api/posts/tags/trending — most-used tags across published posts.
 * @type {import('express').RequestHandler}
 */
const trendingTags = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 20);
  const tags = await Post.aggregate([
    { $match: { status: "published" } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);
  return sendSuccess(res, 200, { tags });
});

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  clapPost,
  toggleBookmark,
  trendingTags,
};
