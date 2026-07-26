"use strict";

const MongoHighlightRepository = require("./highlights.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const HighlightService = require("./highlights.service");
const createHighlightController = require("./highlights.controller");

const highlightRepository = new MongoHighlightRepository();
const postRepository = new MongoPostRepository();
const highlightService = new HighlightService(highlightRepository, postRepository);
const highlightController = createHighlightController(highlightService);

const highlightModule = {
  name: "highlights",
  repository: highlightRepository,
  service: highlightService,
  controller: highlightController,
  boot: (app) => {
    // Express routes can be dynamically hooked here if desired
  },
};

module.exports = {
  highlightModule,
  highlightRepository,
  highlightService,
  highlightController,
};
