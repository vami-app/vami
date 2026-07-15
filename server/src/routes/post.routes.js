"use strict";

const express = require("express");
const {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  clapPost,
  toggleBookmark,
  trendingTags,
} = require("../controllers/post.controller");
const {
  listComments,
  addComment,
} = require("../controllers/comment.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate");
const {
  createPostRules,
  updatePostRules,
  commentRules,
} = require("../validators/post.validator");

const router = express.Router();

router.get("/tags/trending", trendingTags);

router.get("/", optionalAuth, listPosts);
router.post("/", requireAuth, createPostRules, validate, createPost);

router.get("/:slug", optionalAuth, getPost);
router.patch("/:slug", requireAuth, updatePostRules, validate, updatePost);
router.delete("/:slug", requireAuth, deletePost);

router.post("/:slug/clap", requireAuth, clapPost);
router.post("/:slug/bookmark", requireAuth, toggleBookmark);

router.get("/:slug/comments", listComments);
router.post("/:slug/comments", requireAuth, commentRules, validate, addComment);

module.exports = router;
