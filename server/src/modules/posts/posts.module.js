"use strict";

const express = require("express");
const MongoPostRepository = require("./posts.repository.mongo");
const PostService = require("./posts.service");
const PostController = require("./posts.controller");
const { userRepository } = require("../users/users.module");
const { requireAuth, optionalAuth } = require("../../middlewares/auth.middleware");

const postRepository = new MongoPostRepository();
const postService = new PostService(postRepository, userRepository);
const postController = new PostController(postService);

const router = express.Router();

router.get("/posts", optionalAuth, postController.listPosts);
router.post("/posts", requireAuth, postController.createPost);
router.get("/posts/recommended", requireAuth, postController.getRecommendedPosts);
router.get("/posts/tags/trending", postController.trendingTags);
router.get("/posts/tags/autocomplete", postController.autocompleteTags);
router.get("/posts/sitemap-data", postController.listSitemapData);

router.post("/tags/:tag/follow", requireAuth, postController.toggleTagFollow);

router.get("/posts/:slug", optionalAuth, postController.getPost);
router.get("/posts/:slug/related", optionalAuth, postController.getRelatedPosts);
router.patch("/posts/:slug", requireAuth, postController.updatePost);
router.delete("/posts/:slug", requireAuth, postController.deletePost);
router.post("/posts/:slug/clap", requireAuth, postController.clapPost);
router.post("/posts/:slug/bookmark", requireAuth, postController.toggleBookmark);

const postsModule = {
  name: "posts",
  postRepository,
  postService,
  postController,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  postRepository,
  postService,
  postController,
  postsModule,
};
