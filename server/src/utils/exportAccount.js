"use strict";

const { ZipArchive } = require("archiver");
const TurndownService = require("turndown");

const turndown = new TurndownService();

/**
 * Stream a zip export of user profile and posts.
 * @param {import('express').Response} res
 * @param {Object} user - Mongoose User document
 * @param {Array<Object>} posts - Mongoose Post documents
 * @returns {Promise<void>}
 */
async function streamExport(res, user, posts) {
  const archive = new ZipArchive({ zlib: { level: 9 } });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);

  // 1. Add profile.json
  archive.append(JSON.stringify(user.toPublicJSON(true), null, 2), {
    name: "profile.json",
  });

  // 1b. Add followers.json
  const Follow = require("../models/Follow");
  const follows = await Follow.find({ followee: user._id }).populate("follower");
  const followersIndex = follows.map((f) => ({
    name: f.follower ? f.follower.name : "Deleted User",
    email: f.follower ? f.follower.email : "",
    followedAt: f.followedAt,
    sourcePost: f.sourcePost,
  }));
  archive.append(JSON.stringify(followersIndex, null, 2), {
    name: "followers.json",
  });

  // 2. Add posts-index.json
  const index = posts.map((p) => ({
    title: p.title,
    subtitle: p.subtitle,
    slug: p.slug,
    status: p.status,
    tags: p.tags,
    createdAt: p.createdAt,
    publishedAt: p.publishedAt,
    views: p.views,
    totalClaps: p.totalClaps,
  }));
  archive.append(JSON.stringify(index, null, 2), {
    name: "posts-index.json",
  });

  // 3. Add each post's files
  posts.forEach((post) => {
    const postJson = post.toCardJSON();
    postJson.contentHtml = post.contentHtml; // include html body in json
    
    archive.append(JSON.stringify(postJson, null, 2), {
      name: `posts/${post.slug}.json`,
    });
    
    const md = turndown.turndown(post.contentHtml || "");
    archive.append(md, {
      name: `posts/${post.slug}.md`,
    });
  });

  await archive.finalize();
}

module.exports = { streamExport };
