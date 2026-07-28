const express = require("express");
const { requireAuth, optionalAuth } = require("@vami/identity-service");
const {
  createPublication,
  getPublicationBySlug,
  updatePublication,
  inviteMember,
  updateMemberRole,
  removeMember,
  reviewSubmission,
  getPublicationDashboard,
  getMyPublications,
} = require("../controllers/publication.controller");

const router = express.Router();

// Publication management
router.get("/mine", requireAuth, getMyPublications);
router.post("/", requireAuth, createPublication);
router.get("/:slug", optionalAuth, getPublicationBySlug);
router.patch("/:slug", requireAuth, updatePublication);
router.get("/:slug/dashboard", requireAuth, getPublicationDashboard);

// Member management
router.post("/:slug/members", requireAuth, inviteMember);
router.patch("/:slug/members/:userId", requireAuth, updateMemberRole);
router.delete("/:slug/members/:userId", requireAuth, removeMember);

// Submission review workflow
router.patch("/:pubSlug/submissions/:postId", requireAuth, reviewSubmission);

module.exports = router;

