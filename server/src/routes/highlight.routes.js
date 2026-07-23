"use strict";

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  createHighlight,
  getPostHighlights,
  updateHighlight,
  deleteHighlight,
} = require("../controllers/highlight.controller");

// Slug-scoped post highlights
router.post("/posts/:slug/highlights", requireAuth, createHighlight);
router.get("/posts/:slug/highlights/mine", requireAuth, getPostHighlights);

// ID-scoped highlight modifications
router.patch("/highlights/:id", requireAuth, updateHighlight);
router.delete("/highlights/:id", requireAuth, deleteHighlight);

module.exports = router;
