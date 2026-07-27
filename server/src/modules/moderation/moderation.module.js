"use strict";

const express = require("express");
const MongoDisputeRepository = require("./disputes.repository.mongo");
const DisputeService = require("./disputes.service");
const DisputeController = require("./disputes.controller");
const FinalizationJob = require("./finalization.job");

const { userRepository } = require("../users/users.module");
const { postRepository } = require("../posts/posts.module");
const { notificationService } = require("../notifications/notifications.module");

const { requireAuth, requireAdmin } = require("../../middlewares/auth.middleware");

const disputeRepository = new MongoDisputeRepository();
const disputeService = new DisputeService(disputeRepository, userRepository, postRepository, notificationService);
const disputeController = new DisputeController(disputeService);
const finalizationJob = new FinalizationJob(disputeService);

const router = express.Router();

// Writer Endpoints
router.get("/moderation/actions/pending", requireAuth, disputeController.listPendingActions);
router.post("/moderation/disputes", requireAuth, disputeController.fileDispute);
router.get("/moderation/disputes/mine", requireAuth, disputeController.listMyDisputes);

// Reviewer Admin Endpoints
router.get("/moderation/disputes/queue", requireAuth, requireAdmin, disputeController.listAdminQueue);
router.patch("/moderation/disputes/:id/decision", requireAuth, requireAdmin, disputeController.reviewDecision);

// Public Policy Document Endpoint
router.get("/policy/moderation-appeals", disputeController.getPolicy);

const moderationModule = {
  name: "moderation",
  disputeRepository,
  disputeService,
  disputeController,
  finalizationJob,
  router,
  boot: (app) => {
    app.use("/api", router);
  },
};

module.exports = {
  disputeRepository,
  disputeService,
  disputeController,
  finalizationJob,
  moderationModule,
};
