"use strict";

const express = require("express");
const MongoCommentRepository = require("./comments.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const MongoNotificationRepository = require("../notifications/notifications.repository.mongo");
const { CommentService } = require("./comments.service");
const CommentController = require("./comments.controller");
const { requireAuth, optionalAuth } = require("../../middlewares/auth.middleware");
const { validate } = require("../../middlewares/validate");
const { commentRules } = require("../../validators/post.validator");

const commentRepository = new MongoCommentRepository();
const postRepository = new MongoPostRepository();
const notificationRepository = new MongoNotificationRepository();
const commentService = new CommentService(commentRepository, postRepository, notificationRepository);
const commentController = new CommentController(commentService);

const router = express.Router();

router.get("/posts/:slug/comments", optionalAuth, commentController.list);
router.post("/posts/:slug/comments", requireAuth, commentRules, validate, commentController.create);
router.delete("/comments/:id", requireAuth, commentController.remove);

const commentsModule = {
  name: "comments",
  commentRepository,
  commentService,
  commentController,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  commentRepository,
  commentService,
  commentController,
  router,
  commentsModule,
};
