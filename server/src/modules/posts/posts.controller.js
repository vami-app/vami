"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

class PostController {
  constructor(postService) {
    this.service = postService;
  }

  listPosts = asyncHandler(async (req, res) => {
    const { cursor, limit, tag, author, q, status } = req.query;
    const data = await this.service.listPosts({
      cursor,
      limit,
      tag,
      author,
      q,
      status,
      viewer: req.user,
    });
    return sendSuccess(res, 200, data);
  });

  getPost = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.getPost({ slug, viewer: req.user });
    return sendSuccess(res, 200, data);
  });

  createPost = asyncHandler(async (req, res) => {
    const { title, subtitle, contentHtml, coverImage, tags, status, scheduledAt, seo, locked, aiAssisted } = req.body;
    const data = await this.service.createPost({
      author: req.user,
      title,
      subtitle,
      contentHtml,
      coverImage,
      tags,
      status,
      scheduledAt,
      seo,
      locked,
      aiAssisted,
    });
    return sendSuccess(res, 201, data, "Story saved");
  });

  updatePost = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.updatePost({
      slug,
      user: req.user,
      fields: req.body,
    });
    return sendSuccess(res, 200, data, "Story updated");
  });

  deletePost = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.deletePost({ slug, user: req.user });
    return sendSuccess(res, 200, null, data.message);
  });

  clapPost = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { count } = req.body;
    const data = await this.service.clapPost({ slug, user: req.user, count });
    return sendSuccess(
      res,
      200,
      {
        totalClaps: data.totalClaps,
        viewerClapCount: data.viewerClapCount,
        capped: data.capped,
      },
      data.applied > 0 ? "Clapped" : "Clap cap reached"
    );
  });

  toggleBookmark = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.toggleBookmark({ slug, user: req.user });
    return sendSuccess(res, 200, { bookmarked: data.bookmarked }, data.bookmarked ? "Saved" : "Removed");
  });

  trendingTags = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const tags = await this.service.getTrendingTags(limit);
    return sendSuccess(res, 200, { tags });
  });

  listSitemapData = asyncHandler(async (req, res) => {
    const data = await this.service.getSitemapData();
    return sendSuccess(res, 200, data);
  });

  toggleTagFollow = asyncHandler(async (req, res) => {
    const { tag } = req.params;
    const data = await this.service.toggleTagFollow({ tag, user: req.user });
    return sendSuccess(
      res,
      200,
      { followed: data.followed },
      data.followed ? `Following tag #${data.cleanTag}` : `Unfollowed tag #${data.cleanTag}`
    );
  });

  getRelatedPosts = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const data = await this.service.getRelatedPosts({ slug, viewer: req.user });
    return sendSuccess(res, 200, data);
  });

  getRecommendedPosts = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const data = await this.service.getRecommendedPosts({ viewer: req.user, limit });
    return sendSuccess(res, 200, data);
  });

  autocompleteTags = asyncHandler(async (req, res) => {
    const { prefix, limit } = req.query;
    const data = await this.service.autocompleteTags({
      prefix: prefix ? String(prefix) : "",
      limit: limit ? parseInt(limit, 10) : 10,
    });
    return sendSuccess(res, 200, data);
  });
}

module.exports = PostController;

