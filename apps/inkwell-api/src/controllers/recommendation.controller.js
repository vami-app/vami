"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const Post = require("../models/Post");
const Follow = require("../models/Follow");

const AUTHOR_FIELDS = "name username avatarUrl bio";

/**
 * GET /api/posts/recommended — Personalized recommendation scoring ("For You" tab).
 */
const getRecommendedPosts = asyncHandler(async (req, res) => {
  const viewer = req.user;
  const followedTags = viewer.followedTags || [];

  // Get followed authors
  const follows = await Follow.find({ follower: viewer._id }).select("followee");
  const followedAuthorIds = follows.map((f) => String(f.followee));

  // Query candidate pool using shared visibility filter
  const candidates = await Post.find(Post.visibleQuery())
    .sort({ publishedAt: -1, _id: -1 })
    .limit(100)
    .populate("author", AUTHOR_FIELDS);

  const now = Date.now();

  const scoredPosts = candidates.map((post) => {
    // 1. Tag overlap score
    const postTags = post.tags || [];
    const matchingTags = postTags.filter((t) => followedTags.includes(t.toLowerCase()));
    const tagScore = matchingTags.length * 3.0;

    // 2. Author follow score
    const isAuthorFollowed = post.author && followedAuthorIds.includes(String(post.author._id || post.author));
    const authorScore = isAuthorFollowed ? 2.5 : 0.0;

    // 3. Engagement score
    const totalClaps = post.totalClaps || 0;
    const views = post.views || 0;
    const engagementScore = Math.log(1 + totalClaps + views * 0.1) + 1.0;

    // 4. Recency decay (exponential decay over days since publishedAt)
    const pubDate = post.publishedAt ? new Date(post.publishedAt).getTime() : now;
    const ageInDays = Math.max(0, (now - pubDate) / (1000 * 60 * 60 * 24));
    const recencyDecay = Math.exp(-0.05 * ageInDays);

    const finalScore = (tagScore + authorScore + 1.0) * engagementScore * recencyDecay;

    return {
      post,
      score: finalScore,
      reasons: {
        matchingTags,
        isAuthorFollowed,
        totalClaps,
        views,
        ageInDays: Math.round(ageInDays * 10) / 10,
      },
    };
  });

  scoredPosts.sort((a, b) => b.score - a.score);

  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  const selected = scoredPosts.slice(0, limit);

  const posts = selected.map((s) => s.post.toCardJSON(viewer._id));

  return sendSuccess(res, 200, {
    posts,
    factors: {
      followedTagsCount: followedTags.length,
      followedAuthorsCount: followedAuthorIds.length,
    },
  });
});

module.exports = {
  getRecommendedPosts,
};
