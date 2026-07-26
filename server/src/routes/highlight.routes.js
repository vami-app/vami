"use strict";

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { highlightController } = require("../modules/highlights/highlights.module");

// Slug-scoped post highlights
router.post("/posts/:slug/highlights", requireAuth, highlightController.createHighlight);
router.get("/posts/:slug/highlights/mine", requireAuth, highlightController.getPostHighlights);

// ID-scoped highlight modifications
router.patch("/highlights/:id", requireAuth, highlightController.updateHighlight);
router.delete("/highlights/:id", requireAuth, highlightController.deleteHighlight);

module.exports = router;
