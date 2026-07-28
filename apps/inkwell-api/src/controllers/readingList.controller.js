"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { makeSlug } = require("../utils/slugify");
const ReadingList = require("../models/ReadingList");
const Post = require("../models/Post");
const User = require("@vami/identity-service").User;

const AUTHOR_FIELDS = "name username avatarUrl bio";

/**
 * POST /api/lists — Create reading list.
 */
const createList = asyncHandler(async (req, res) => {
  const { name, visibility } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, "List name is required");

  const slug = makeSlug(name);
  if (!slug) throw new ApiError(400, "Invalid list name");

  const existingList = await ReadingList.findOne({ owner: req.user._id, slug });
  if (existingList) {
    throw new ApiError(400, "You already have a reading list with this name.");
  }

  const list = await ReadingList.create({
    owner: req.user._id,
    name: name.trim(),
    slug,
    visibility: visibility === "public" ? "public" : "private",
  });

  return sendSuccess(res, 201, { list }, "Reading list created successfully");
});

/**
 * GET /api/lists/mine — Authenticated user's reading lists.
 */
const getMine = asyncHandler(async (req, res) => {
  const lists = await ReadingList.find({ owner: req.user._id }).sort({ updatedAt: -1 });
  return sendSuccess(res, 200, { lists });
});

/**
 * GET /api/users/:username/lists — Public lists for a user profile.
 */
const getUserPublicLists = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const targetUser = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (!targetUser) throw new ApiError(404, "User not found");

  const isOwner = req.user && String(req.user._id) === String(targetUser._id);
  const filter = { owner: targetUser._id };
  if (!isOwner) {
    filter.visibility = "public";
  }

  const lists = await ReadingList.find(filter).sort({ updatedAt: -1 });
  return sendSuccess(res, 200, { lists });
});

/**
 * GET /api/lists/:username/:slug — View single reading list with items.
 */
const getSingleList = asyncHandler(async (req, res) => {
  const { username, slug } = req.params;
  const ownerUser = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (!ownerUser) throw new ApiError(404, "Reading list not found");

  const list = await ReadingList.findOne({ owner: ownerUser._id, slug });
  if (!list) throw new ApiError(404, "Reading list not found");

  const isOwner = req.user && String(req.user._id) === String(ownerUser._id);
  if (list.visibility === "private" && !isOwner) {
    throw new ApiError(404, "Reading list not found");
  }

  // Populate posts
  await list.populate({
    path: "posts.post",
    populate: { path: "author", select: AUTHOR_FIELDS },
  });

  const viewerId = req.user ? req.user._id : null;

  // Process items to handle dangling references gracefully
  const processedPosts = list.posts.map((item) => {
    const p = item.post;
    if (!p || p.moderationStatus === "hidden") {
      return {
        id: null,
        isRemoved: true,
        title: "[Content unavailable]",
        subtitle: "This story is no longer available or was removed.",
        addedAt: item.addedAt,
      };
    }
    const cardData = p.toCardJSON(viewerId);
    cardData.addedAt = item.addedAt;
    return cardData;
  });

  return sendSuccess(res, 200, {
    list: {
      id: list._id,
      name: list.name,
      slug: list.slug,
      visibility: list.visibility,
      owner: ownerUser.toPublicJSON(),
      createdAt: list.createdAt,
    },
    posts: processedPosts,
  });
});

/**
 * PATCH /api/lists/:id — Update list name or visibility.
 */
const updateList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const list = await ReadingList.findById(id);
  if (!list) throw new ApiError(404, "Reading list not found");

  if (String(list.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You can only update your own reading lists.");
  }

  const { name, visibility } = req.body;
  if (name !== undefined && name.trim()) {
    list.name = name.trim();
    list.slug = makeSlug(name);
  }
  if (visibility !== undefined && ["public", "private"].includes(visibility)) {
    list.visibility = visibility;
  }

  await list.save();
  return sendSuccess(res, 200, { list }, "Reading list updated");
});

/**
 * POST /api/lists/:id/posts — Add post to reading list.
 */
const addPostToList = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { postId, postSlug } = req.body;

  const list = await ReadingList.findById(id);
  if (!list) throw new ApiError(404, "Reading list not found");

  if (String(list.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You can only add posts to your own reading lists.");
  }

  let post;
  if (postId) {
    post = await Post.findById(postId);
  } else if (postSlug) {
    post = await Post.findOne({ slug: postSlug });
  }

  if (!post) throw new ApiError(404, "Story not found");

  // Interaction block on non-visible content: draft or hidden posts cannot be added
  if (post.status !== "published" || post.moderationStatus === "hidden") {
    throw new ApiError(400, "Draft or hidden stories cannot be added to reading lists.");
  }

  const exists = list.posts.some((item) => String(item.post) === String(post._id));
  if (!exists) {
    list.posts.push({ post: post._id, addedAt: new Date() });
    await list.save();
  }

  return sendSuccess(res, 200, { list }, "Story added to reading list");
});

/**
 * DELETE /api/lists/:id/posts/:postId — Remove post from list.
 */
const removePostFromList = asyncHandler(async (req, res) => {
  const { id, postId } = req.params;

  const list = await ReadingList.findById(id);
  if (!list) throw new ApiError(404, "Reading list not found");

  if (String(list.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You can only edit your own reading lists.");
  }

  list.posts = list.posts.filter((item) => String(item.post) !== String(postId));
  await list.save();

  return sendSuccess(res, 200, { list }, "Story removed from reading list");
});

/**
 * DELETE /api/lists/:id — Delete reading list.
 */
const deleteList = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const list = await ReadingList.findById(id);
  if (!list) throw new ApiError(404, "Reading list not found");

  if (String(list.owner) !== String(req.user._id)) {
    throw new ApiError(403, "You can only delete your own reading lists.");
  }

  await list.deleteOne();
  return sendSuccess(res, 200, null, "Reading list deleted");
});

module.exports = {
  createList,
  getMine,
  getUserPublicLists,
  getSingleList,
  updateList,
  addPostToList,
  removePostFromList,
  deleteList,
};
