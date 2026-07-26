"use strict";

const express = require("express");
const { requireAuth, optionalAuth } = require("../../middlewares/auth.middleware");
const MongoReadingListRepository = require("./reading-lists.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const ReadingListService = require("./reading-lists.service");
const ReadingListController = require("./reading-lists.controller");

const readingListRepository = new MongoReadingListRepository();
const postRepository = new MongoPostRepository();
const readingListService = new ReadingListService(readingListRepository, postRepository);
const readingListController = new ReadingListController(readingListService);

const router = express.Router();

router.post("/", requireAuth, readingListController.createList);
router.get("/mine", requireAuth, readingListController.getMine);
router.get("/:username/:slug", optionalAuth, readingListController.getSingleList);
router.patch("/:id", requireAuth, readingListController.updateList);
router.post("/:id/posts", requireAuth, readingListController.addPostToList);
router.delete("/:id/posts/:postId", requireAuth, readingListController.removePostFromList);
router.delete("/:id", requireAuth, readingListController.deleteList);

const readingListModule = {
  name: "reading-lists",
  router,
  repository: readingListRepository,
  service: readingListService,
  controller: readingListController,
  boot: (app) => {
    app.use("/api/lists", router);
  },
};

module.exports = {
  readingListModule,
  readingListRepository,
  readingListController,
};
