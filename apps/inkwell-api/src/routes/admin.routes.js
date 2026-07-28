"use strict";

const express = require("express");
const {
  listReports,
  resolveReport,
  unhidePost,
  unhideComment,
  listUsers,
  banUser,
  unbanUser,
  updateUserRole,
  getStats,
} = require("../controllers/admin.controller");
const { requireAuth, requireAdmin } = require("@vami/identity-service");

const router = express.Router();

// Enforce authentication and admin authorization globally on admin routes
router.use(requireAuth, requireAdmin);

router.get("/reports", listReports);
router.patch("/reports/:id", resolveReport);
router.patch("/posts/:id/unhide", unhidePost);
router.patch("/comments/:id/unhide", unhideComment);

router.get("/users", listUsers);
router.patch("/users/:id/ban", banUser);
router.patch("/users/:id/unban", unbanUser);
router.patch("/users/:id/role", updateUserRole);

router.get("/stats", getStats);

module.exports = router;
