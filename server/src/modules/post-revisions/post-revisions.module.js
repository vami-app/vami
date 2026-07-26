"use strict";

const express = require("express");
const MongoPostRevisionRepository = require("./post-revisions.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const PostRevisionService = require("./post-revisions.service");
const createPostRevisionController = require("./post-revisions.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");

const postRevisionRepository = new MongoPostRevisionRepository();
const postRepository = new MongoPostRepository();
const postRevisionService = new PostRevisionService(postRevisionRepository, postRepository);
const postRevisionController = createPostRevisionController(postRevisionService);

const router = express.Router();
router.get("/posts/:slug/revisions", requireAuth, postRevisionController.listRevisions);
router.get("/posts/:slug/revisions/:revisionId", requireAuth, postRevisionController.getRevisionDetails);
router.post("/posts/:slug/revisions/:revisionId/restore", requireAuth, postRevisionController.restoreRevision);

const postRevisionsModule = {
  name: "post-revisions",
  repository: postRevisionRepository,
  service: postRevisionService,
  controller: postRevisionController,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  postRevisionsModule,
  postRevisionRepository,
  postRevisionService,
  postRevisionController,
};
