"use strict";

const express = require("express");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const {
  createPublication,
  getPublicationBySlug,
  updatePublication,
  inviteMember,
  updateMemberRole,
  removeMember,
  submitPost,
  reviewSubmission,
  withdrawSubmission,
  getPublicationDashboard,
  getMyPublications,
} = require("../controllers/publication.controller");

const router = express.Router();

// Publication management
router.get("/publications/mine", requireAuth, getMyPublications);
router.post("/publications", requireAuth, createPublication);
router.get("/publications/:slug", optionalAuth, getPublicationBySlug);
router.patch("/publications/:slug", requireAuth, updatePublication);
router.get("/publications/:slug/dashboard", requireAuth, getPublicationDashboard);

// Member management
router.post("/publications/:slug/members", requireAuth, inviteMember);
router.patch("/publications/:slug/members/:userId", requireAuth, updateMemberRole);
router.delete("/publications/:slug/members/:userId", requireAuth, removeMember);

// Submission & review workflow
router.post("/posts/:slug/submit", requireAuth, submitPost);
router.delete("/posts/:slug/submit", requireAuth, withdrawSubmission);
router.patch("/publications/:pubSlug/submissions/:postId", requireAuth, reviewSubmission);

module.exports = router;
