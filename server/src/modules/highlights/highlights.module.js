"use strict";

const express = require("express");
const MongoHighlightRepository = require("./highlights.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const HighlightService = require("./highlights.service");
const createHighlightController = require("./highlights.controller");
const { requireAuth } = require("../../middlewares/auth.middleware");

const highlightRepository = new MongoHighlightRepository();
const postRepository = new MongoPostRepository();
const highlightService = new HighlightService(highlightRepository, postRepository);
const highlightController = createHighlightController(highlightService);

const router = express.Router();
router.post("/posts/:slug/highlights", requireAuth, highlightController.createHighlight);
router.get("/posts/:slug/highlights/mine", requireAuth, highlightController.getPostHighlights);
router.patch("/highlights/:id", requireAuth, highlightController.updateHighlight);
router.delete("/highlights/:id", requireAuth, highlightController.deleteHighlight);

const highlightModule = {
  name: "highlights",
  repository: highlightRepository,
  service: highlightService,
  controller: highlightController,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  highlightModule,
  highlightRepository,
  highlightService,
  highlightController,
};
