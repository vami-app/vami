"use strict";

const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { makeSlug } = require("../utils/slugify");
const { sanitizeContent } = require("../utils/sanitize");
const { notifyFollowersOfNewPost } = require("../utils/notify");
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
      Object.assign(filter, Post.visibleQuery());
      if (authorUser) filter.author = authorUser._id;
    }
  } else {
    Object.assign(filter, Post.visibleQuery());
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
  const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

  // Drafts are visible only to their author
  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

  // Hidden posts are visible only to their author or an admin
  const isAdmin = req.user && req.user.role === "admin";
  if (post.moderationStatus === "hidden" && !isAuthor && !isAdmin) {
    throw new ApiError(404, "Story not found");
  }

  // Count a view only for published stories and not for the author's own reads
  if (post.status === "published" && !isAuthor) {
    post.views += 1;
    await post.save();
  }

  const { canReadFull } = require("../utils/entitlement");
  const data = post.toCardJSON(viewerId);
  const userCanRead = canReadFull(post, req.user);

  if (post.locked && !userCanRead) {
    const pMatches = (post.contentHtml || "").match(/<p[\s\S]*?<\/p>/gi);
    const count = post.previewParagraphCount || 3;
    if (pMatches && pMatches.length > count) {
      data.contentHtml = pMatches.slice(0, count).join("");
    } else {
      data.contentHtml = post.contentHtml;
    }
    data.isLocked = true;
    data.previewOnly = true;
  } else {
    data.contentHtml = post.contentHtml;
    data.isLocked = Boolean(post.locked);
    data.previewOnly = false;
  }

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
  const { title, subtitle, contentHtml, coverImage, tags, status, scheduledAt, seo, locked } = req.body;

  if (status === "published" && !req.user.emailVerified) {
    throw new ApiError(403, "Please verify your email address before publishing stories.");
  }

  let parsedScheduledAt = null;
  if (scheduledAt) {
    parsedScheduledAt = new Date(scheduledAt);
    if (isNaN(parsedScheduledAt.getTime()) || parsedScheduledAt <= new Date()) {
      throw new ApiError(400, "scheduledAt must be a future date and time");
    }
  }

  const post = new Post({
    title,
    subtitle: subtitle || "",
    slug: makeSlug(title),
    contentHtml: sanitizeContent(contentHtml || "<p></p>"),
    coverImage: coverImage || "",
    tags: normalizeTags(tags),
    author: req.user._id,
    status: status === "published" ? "published" : "draft",
    scheduledAt: parsedScheduledAt,
    locked: locked !== undefined ? Boolean(locked) : false,
    seo: {
      metaTitle: (seo && seo.metaTitle) ? String(seo.metaTitle).trim().slice(0, 160) : undefined,
      metaDescription: (seo && seo.metaDescription) ? String(seo.metaDescription).trim().slice(0, 200) : undefined,
    }
  });
  if (post.status === "published") post.publishedAt = new Date();

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);

  if (post.status === "published" && !post.notifiedAt) {
    post.notifiedAt = new Date();
    await Post.updateOne({ _id: post._id }, { notifiedAt: post.notifiedAt });
    notifyFollowersOfNewPost(post).catch((err) => console.error("Notification failed:", err));
  }

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

  const { title, subtitle, contentHtml, coverImage, tags, status, scheduledAt, seo, locked } = req.body;

  const PostRevision = require("../models/PostRevision");
  const titleChanged = title !== undefined && title !== post.title;
  const subtitleChanged = subtitle !== undefined && subtitle !== post.subtitle;
  const contentChanged = contentHtml !== undefined && sanitizeContent(contentHtml) !== post.contentHtml;
  const coverImageChanged = coverImage !== undefined && coverImage !== post.coverImage;
  
  let tagsChanged = false;
  if (tags !== undefined) {
    const nextTags = normalizeTags(tags);
    if (nextTags.length !== post.tags.length || !nextTags.every((val, index) => val === post.tags[index])) {
      tagsChanged = true;
    }
  }

  if (titleChanged || subtitleChanged || contentChanged || coverImageChanged || tagsChanged) {
    await PostRevision.create({
      post: post._id,
      title: post.title,
      subtitle: post.subtitle,
      contentHtml: post.contentHtml,
      tags: post.tags,
      coverImage: post.coverImage,
      editedBy: req.user._id,
    });

    const revisionsCount = await PostRevision.countDocuments({ post: post._id });
    if (revisionsCount > 50) {
      const oldestRevisions = await PostRevision.find({ post: post._id })
        .sort({ createdAt: 1 })
        .limit(revisionsCount - 50);
      const oldestIds = oldestRevisions.map(r => r._id);
      await PostRevision.deleteMany({ _id: { $in: oldestIds } });
    }
  }

  if (title !== undefined) post.title = title;
  if (subtitle !== undefined) post.subtitle = subtitle;
  if (contentHtml !== undefined) post.contentHtml = sanitizeContent(contentHtml);
  if (coverImage !== undefined) post.coverImage = coverImage;
  if (tags !== undefined) post.tags = normalizeTags(tags);
  if (locked !== undefined) post.locked = Boolean(locked);

  if (status === "published" && post.status !== "published" && !req.user.emailVerified) {
    throw new ApiError(403, "Please verify your email address before publishing stories.");
  }

  if (scheduledAt !== undefined) {
    if (scheduledAt === null || scheduledAt === "") {
      post.scheduledAt = null;
    } else {
      const parsed = new Date(scheduledAt);
      if (isNaN(parsed.getTime()) || parsed <= new Date()) {
        throw new ApiError(400, "scheduledAt must be a future date and time");
      }
      post.scheduledAt = parsed;
    }
  }

  if (status !== undefined && status !== post.status) {
    post.status = status;
    if (status === "published" && !post.publishedAt) post.publishedAt = new Date();
  }

  if (seo !== undefined) {
    post.seo = {
      metaTitle: seo.metaTitle !== undefined ? String(seo.metaTitle).trim().slice(0, 160) : (post.seo ? post.seo.metaTitle : undefined),
      metaDescription: seo.metaDescription !== undefined ? String(seo.metaDescription).trim().slice(0, 200) : (post.seo ? post.seo.metaDescription : undefined),
      canonicalUrl: post.seo ? post.seo.canonicalUrl : undefined
    };
  }

  await post.save();
  await post.populate("author", AUTHOR_FIELDS);

  if (post.status === "published" && !post.notifiedAt) {
    post.notifiedAt = new Date();
    await Post.updateOne({ _id: post._id }, { notifiedAt: post.notifiedAt });
    notifyFollowersOfNewPost(post).catch((err) => console.error("Notification failed:", err));
  }

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

  const viewerId = req.user ? req.user._id : null;
  const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

  if (post.status !== "published") {
    throw new ApiError(400, "Cannot clap an unpublished story");
  }

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

  // Notification trigger (coalesce claps within last 1 hour)
  if (applied > 0 && String(req.user._id) !== String(post.author)) {
    const Notification = require("../models/Notification");
    const { emitNotificationToUser } = require("../config/socket");

    let notif = await Notification.findOne({
      recipient: post.author,
      actor: req.user._id,
      type: "clap",
      targetType: "post",
      targetId: post._id,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (notif) {
      notif.read = false;
      await notif.save();
    } else {
      notif = await Notification.create({
        recipient: post.author,
        actor: req.user._id,
        type: "clap",
        targetType: "post",
        targetId: post._id,
      });
    }

    const populatedNotif = await Notification.findById(notif._id).populate("actor", "name username avatarUrl").lean();
    emitNotificationToUser(post.author, populatedNotif);
  }

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
  const post = await Post.findOne({ slug: req.params.slug }).select("_id status author");
  if (!post) throw new ApiError(404, "Story not found");

  const viewerId = req.user ? req.user._id : null;
  const isAuthor = viewerId && post.author && String(post.author._id || post.author) === String(viewerId);

  if (post.status === "draft" && !isAuthor) {
    throw new ApiError(404, "Story not found");
  }

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
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const tags = await Post.aggregate([
    { $match: Post.visibleQuery({ publishedAt: { $gte: sevenDaysAgo } }) },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    { $project: { _id: 0, tag: "$_id", count: 1 } },
  ]);
  return sendSuccess(res, 200, { tags });
});

/**
 * GET /api/posts/sitemap-data — minimal fields for sitemap.xml.
 * @type {import('express').RequestHandler}
 */
const listSitemapData = asyncHandler(async (req, res) => {
  const posts = await Post.find(Post.visibleQuery({ indexable: true }))
    .select("slug updatedAt author")
    .populate("author", "username")
    .sort({ updatedAt: -1 });

  const formattedPosts = posts.map(p => ({
    slug: p.slug,
    updatedAt: p.updatedAt,
    authorUsername: p.author ? p.author.username : "deleted",
  }));

  return sendSuccess(res, 200, { posts: formattedPosts });
});

/**
 * POST /api/tags/:tag/follow — follow/unfollow a tag.
 * @type {import('express').RequestHandler}
 */
const toggleTagFollow = asyncHandler(async (req, res) => {
  const tag = req.params.tag.toLowerCase().trim();
  if (!tag) throw new ApiError(400, "Tag parameter is required");

  // Check if tag exists (is previously used in a published post)
  const tagExists = await Post.findOne(Post.visibleQuery({ tags: tag }));
  if (!tagExists) {
    throw new ApiError(400, "That tag does not exist or has no published stories");
  }

  const user = req.user;
  if (!user.followedTags) {
    user.followedTags = [];
  }

  const idx = user.followedTags.indexOf(tag);
  let followed;
  if (idx >= 0) {
    user.followedTags.splice(idx, 1);
    followed = false;
  } else {
    user.followedTags.push(tag);
    followed = true;
  }

  await user.save();

  return sendSuccess(
    res,
    200,
    { followed },
    followed ? `Following tag #${tag}` : `Unfollowed tag #${tag}`
  );
});

/**
 * GET /api/posts/:slug/revisions
 * List revision metadata for a story (author-only).
 * @type {import('express').RequestHandler}
 */
const listRevisions = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id author");
  if (!post) throw new ApiError(404, "Story not found");

  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only view revisions of your own stories");
  }

  const PostRevision = require("../models/PostRevision");
  const revisions = await PostRevision.find({ post: post._id })
    .sort({ createdAt: -1 })
    .select("_id createdAt editedBy")
    .populate("editedBy", "name username avatarUrl");

  return sendSuccess(res, 200, { revisions });
});

/**
 * GET /api/posts/:slug/revisions/:revisionId
 * Fetch full snapshot content of a specific revision (author-only).
 * @type {import('express').RequestHandler}
 */
const getRevisionDetails = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug }).select("_id author");
  if (!post) throw new ApiError(404, "Story not found");

  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only view revisions of your own stories");
  }

  const PostRevision = require("../models/PostRevision");
  const revision = await PostRevision.findOne({ _id: req.params.revisionId, post: post._id })
    .populate("editedBy", "name username avatarUrl");

  if (!revision) {
    throw new ApiError(404, "Revision not found");
  }

  return sendSuccess(res, 200, { revision });
});

/**
 * POST /api/posts/:slug/revisions/:revisionId/restore
 * Restores the post content to a prior revision snapshot (author-only).
 * @type {import('express').RequestHandler}
 */
const restoreRevision = asyncHandler(async (req, res) => {
  const post = await Post.findOne({ slug: req.params.slug });
  if (!post) throw new ApiError(404, "Story not found");

  if (String(post.author) !== String(req.user._id)) {
    throw new ApiError(403, "You can only restore revisions of your own stories");
  }

  const PostRevision = require("../models/PostRevision");
  const revision = await PostRevision.findOne({ _id: req.params.revisionId, post: post._id });
  if (!revision) {
    throw new ApiError(404, "Revision not found");
  }

  // Snapshot the CURRENT state as a new revision (making this restore action undoable)
  await PostRevision.create({
    post: post._id,
    title: post.title,
    subtitle: post.subtitle,
    contentHtml: post.contentHtml,
    tags: post.tags,
    coverImage: post.coverImage,
    editedBy: req.user._id,
  });

  // Apply revision content
  post.title = revision.title;
  post.subtitle = revision.subtitle;
  post.contentHtml = revision.contentHtml;
  post.tags = revision.tags;
  post.coverImage = revision.coverImage;

  await post.save();

  // Prune revisions to keep max 50
  const revisionsCount = await PostRevision.countDocuments({ post: post._id });
  if (revisionsCount > 50) {
    const oldestRevisions = await PostRevision.find({ post: post._id })
      .sort({ createdAt: 1 })
      .limit(revisionsCount - 50);
    const oldestIds = oldestRevisions.map(r => r._id);
    await PostRevision.deleteMany({ _id: { $in: oldestIds } });
  }

  return sendSuccess(res, 200, { post: post.toCardJSON(req.user._id) }, "Revision restored successfully.");
});

/**
 * GET /api/posts/:slug/related — up to 3 related stories sharing tags with current post.
 * @type {import('express').RequestHandler}
 */
const getRelatedPosts = asyncHandler(async (req, res) => {
  const currentPost = await Post.findOne({ slug: req.params.slug });
  if (!currentPost) throw new ApiError(404, "Story not found");

  const tags = currentPost.tags || [];
  if (tags.length === 0) {
    return sendSuccess(res, 200, { posts: [] });
  }

  const candidates = await Post.find(
    Post.visibleQuery({
      _id: { $ne: currentPost._id },
      tags: { $in: tags },
    })
  )
    .sort({ publishedAt: -1, _id: -1 })
    .limit(20)
    .populate("author", AUTHOR_FIELDS);

  // Score candidate posts based on tag overlap count
  const currentTagSet = new Set(tags.map((t) => t.toLowerCase()));
  const scoredCandidates = candidates.map((p) => {
    const matchCount = (p.tags || []).filter((t) => currentTagSet.has(t.toLowerCase())).length;
    return { post: p, matchCount };
  });

  scoredCandidates.sort((a, b) => b.matchCount - a.matchCount);

  const viewerId = req.user ? req.user._id : null;
  const relatedPosts = scoredCandidates.slice(0, 3).map((item) => item.post.toCardJSON(viewerId));

  return sendSuccess(res, 200, { posts: relatedPosts });
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
  listSitemapData,
  toggleTagFollow,
  listRevisions,
  getRevisionDetails,
  restoreRevision,
  getRelatedPosts,
};
