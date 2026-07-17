"use strict";

const express = require("express");
const Post = require("../models/Post");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { buildFeed } = require("../utils/rss");
const env = require("../config/env");

const router = express.Router();

const AUTHOR_FIELDS = "name username avatarUrl bio";

/**
 * GET /api/feed/rss — Global feed, latest 50 published stories.
 */
router.get(
  "/rss",
  asyncHandler(async (req, res) => {
    const posts = await Post.find({ status: "published", indexable: true, moderationStatus: "visible" })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(50)
      .populate("author", AUTHOR_FIELDS);

    const rssXml = buildFeed({
      title: "Inkwell Stories",
      id: env.clientUrl,
      link: env.clientUrl,
      posts,
    });

    res.header("Content-Type", "application/rss+xml");
    return res.send(rssXml);
  })
);

/**
 * GET /api/feed/user/:username/rss — User feed, latest 50 stories by user.
 */
router.get(
  "/user/:username/rss",
  asyncHandler(async (req, res) => {
    const username = String(req.params.username).toLowerCase().trim();
    const user = await User.findOne({ username });
    if (!user) {
      res.header("Content-Type", "application/rss+xml");
      return res.send(
        buildFeed({
          title: `Inkwell Stories by @${username}`,
          id: `${env.clientUrl}/@${username}`,
          link: env.clientUrl,
          posts: [],
        })
      );
    }

    const posts = await Post.find({
      author: user._id,
      status: "published",
      indexable: true,
      moderationStatus: "visible",
    })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(50)
      .populate("author", AUTHOR_FIELDS);

    const rssXml = buildFeed({
      title: `${user.name} (@${user.username}) — Inkwell Stories`,
      id: `${env.clientUrl}/@${user.username}`,
      link: env.clientUrl,
      posts,
    });

    res.header("Content-Type", "application/rss+xml");
    return res.send(rssXml);
  })
);

/**
 * GET /api/feed/tag/:tag/rss — Tag feed, latest 50 stories under a tag.
 */
router.get(
  "/tag/:tag/rss",
  asyncHandler(async (req, res) => {
    const tag = String(req.params.tag).toLowerCase().trim();
    const posts = await Post.find({
      tags: tag,
      status: "published",
      indexable: true,
      moderationStatus: "visible",
    })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(50)
      .populate("author", AUTHOR_FIELDS);

    const rssXml = buildFeed({
      title: `#${tag} stories on Inkwell`,
      id: `${env.clientUrl}/tag/${tag}`,
      link: env.clientUrl,
      posts,
    });

    res.header("Content-Type", "application/rss+xml");
    return res.send(rssXml);
  })
);

module.exports = router;
