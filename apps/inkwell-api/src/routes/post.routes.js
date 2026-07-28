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
  listSitemapData,
  toggleTagFollow,
  listRevisions,
  getRevisionDetails,
  restoreRevision,
  getRelatedPosts,
} = require("../controllers/post.controller");
const {
  listComments,
  addComment,
} = require("../controllers/comment.controller");
const { requireAuth, optionalAuth } = require("@vami/identity-service");
const { validate } = require("../middlewares/validate");
const {
  createPostRules,
  updatePostRules,
  commentRules,
} = require("../validators/post.validator");

const { getRecommendedPosts } = require("../controllers/recommendation.controller");
const { submitPost, withdrawSubmission } = require("../controllers/publication.controller");

const router = express.Router();

router.get("/tags/trending", trendingTags);
router.get("/sitemap-data", listSitemapData);
router.get("/recommended", requireAuth, getRecommendedPosts);

router.get("/", optionalAuth, listPosts);
router.post("/", requireAuth, createPostRules, validate, createPost);

router.post("/:slug/submit", requireAuth, submitPost);
router.delete("/:slug/submit", requireAuth, withdrawSubmission);

router.get("/:slug", optionalAuth, getPost);
router.get("/:slug/related", optionalAuth, getRelatedPosts);
router.patch("/:slug", requireAuth, updatePostRules, validate, updatePost);
router.delete("/:slug", requireAuth, deletePost);

router.post("/:slug/clap", requireAuth, clapPost);
router.post("/:slug/bookmark", requireAuth, toggleBookmark);
router.post("/tags/:tag/follow", requireAuth, toggleTagFollow);

router.get("/:slug/revisions", requireAuth, listRevisions);
router.get("/:slug/revisions/:revisionId", requireAuth, getRevisionDetails);
router.post("/:slug/revisions/:revisionId/restore", requireAuth, restoreRevision);

router.get("/:slug/comments", optionalAuth, listComments);
router.post("/:slug/comments", requireAuth, commentRules, validate, addComment);

module.exports = router;
