"use strict";

const express = require("express");
const MongoPublicationRepository = require("./publications.repository.mongo");
const MongoPublicationMemberRepository = require("./publication-members.repository.mongo");
const MongoPostRepository = require("../posts/posts.repository.mongo");
const PublicationService = require("./publications.service");
const PublicationController = require("./publications.controller");
const { requireAuth, optionalAuth } = require("../../middlewares/auth.middleware");

const publicationRepository = new MongoPublicationRepository();
const publicationMemberRepository = new MongoPublicationMemberRepository();
const postRepository = new MongoPostRepository();

const publicationService = new PublicationService(
  publicationRepository,
  publicationMemberRepository,
  postRepository
);
const publicationController = new PublicationController(publicationService);

const router = express.Router();

// Specific publication sub-routes mounted BEFORE parameterized /publications/:slug
router.get("/publications/mine", requireAuth, publicationController.mine);
router.post("/publications", requireAuth, publicationController.create);

router.get("/publications/:slug/dashboard", requireAuth, publicationController.dashboard);
router.post("/publications/:slug/members", requireAuth, publicationController.invite);
router.patch("/publications/:slug/members/:userId", requireAuth, publicationController.updateRole);
router.delete("/publications/:slug/members/:userId", requireAuth, publicationController.remove);
router.patch("/publications/:pubSlug/submissions/:postId", requireAuth, publicationController.review);

// Base parameterized publication routes
router.get("/publications/:slug", optionalAuth, publicationController.getBySlug);
router.patch("/publications/:slug", requireAuth, publicationController.update);

// Submission author workflow (mounted on /posts)
router.post("/posts/:slug/submit", requireAuth, publicationController.submit);
router.delete("/posts/:slug/submit", requireAuth, publicationController.withdraw);

const publicationsModule = {
  name: "publications",
  publicationRepository,
  publicationMemberRepository,
  publicationService,
  publicationController,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  publicationRepository,
  publicationMemberRepository,
  publicationService,
  publicationController,
  router,
  publicationsModule,
};
