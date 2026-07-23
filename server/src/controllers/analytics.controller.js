"use strict";

const Post = require("../models/Post");
const Comment = require("../models/Comment");
const ReadEvent = require("../models/ReadEvent");
const Follow = require("../models/Follow");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

/**
 * GET /api/writer/analytics
 * Retrieves aggregated writer analytics for published/created posts, 30-day trends, and follower counts.
 * PRIVACY GUARANTEE: Never exposes individual viewer identities in the response payload.
 */
const getWriterAnalytics = asyncHandler(async (req, res) => {
  const authorId = req.user._id;

  // 1. Fetch author's posts
  const posts = await Post.find({ author: authorId })
    .sort({ createdAt: -1 })
    .lean();

  const postIds = posts.map((p) => p._id);

  // 2. Fetch comment counts per post
  const commentCounts = await Comment.aggregate([
    { $match: { post: { $in: postIds } } },
    { $group: { _id: "$post", count: { $sum: 1 } } },
  ]);
  const commentMap = {};
  commentCounts.forEach((c) => {
    commentMap[String(c._id)] = c.count;
  });

  // 3. Fetch ReadEvents aggregation per post (average read time & total active read seconds)
  const readEventStats = await ReadEvent.aggregate([
    { $match: { post: { $in: postIds } } },
    {
      $group: {
        _id: "$post",
        totalSeconds: { $sum: "$activeSeconds" },
        eventCount: { $sum: 1 },
        avgActiveSeconds: { $avg: "$activeSeconds" },
      },
    },
  ]);
  const readStatsMap = {};
  readEventStats.forEach((r) => {
    readStatsMap[String(r._id)] = {
      avgReadTimeSeconds: Math.round(r.avgActiveSeconds || 0),
      totalReadSeconds: r.totalSeconds || 0,
      totalReadSessions: r.eventCount || 0,
    };
  });

  // Format per-post summary (strictly aggregate, zero viewer IDs)
  const postSummaries = posts.map((p) => {
    const pId = String(p._id);
    const readStats = readStatsMap[pId] || { avgReadTimeSeconds: 0, totalReadSeconds: 0, totalReadSessions: 0 };
    return {
      id: p._id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      views: p.views || 0,
      totalClaps: p.totalClaps || 0,
      commentCount: commentMap[pId] || 0,
      avgReadTimeSeconds: readStats.avgReadTimeSeconds,
      isCurrentlyHidden: p.moderationStatus === "hidden",
      publishedAt: p.publishedAt || p.createdAt,
    };
  });

  // 4. Calculate 30-day daily trend for views & claps
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReadEvents = await ReadEvent.aggregate([
    {
      $match: {
        post: { $in: postIds },
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        reads: { $sum: 1 },
      },
    },
  ]);

  const trendMap = {};
  // Pre-fill 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    trendMap[dateStr] = { date: dateStr, views: 0, claps: 0 };
  }

  recentReadEvents.forEach((r) => {
    if (trendMap[r._id]) {
      trendMap[r._id].views = r.reads;
    }
  });

  const trend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  // 5. Follower stats
  const totalFollowers = await Follow.countDocuments({ followee: authorId });
  const recentFollowers = await Follow.aggregate([
    {
      $match: {
        followee: authorId,
        createdAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const followerGrowthMap = {};
  recentFollowers.forEach((f) => {
    followerGrowthMap[f._id] = f.count;
  });

  return sendSuccess(res, 200, {
    analytics: {
      posts: postSummaries,
      trend,
      followerCount: totalFollowers,
      followerGrowthMap,
    },
  }, "Writer analytics retrieved successfully");
});

module.exports = {
  getWriterAnalytics,
};
