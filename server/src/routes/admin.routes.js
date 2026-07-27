"use strict";

const express = require("express");
const {
  listReports,
  resolveReport,
  unhidePost,
  unhideComment,
  getStats,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("../middlewares/auth.middleware");

const router = express.Router();

// Enforce authentication and admin authorization globally on admin routes
router.use(requireAuth, requireAdmin);

router.get("/reports", listReports);
router.patch("/reports/:id", resolveReport);
router.patch("/posts/:id/unhide", unhidePost);
router.patch("/comments/:id/unhide", unhideComment);

router.get("/stats", getStats);

module.exports = router;
