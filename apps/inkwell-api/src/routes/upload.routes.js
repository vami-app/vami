"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const { requireAuth } = require("@vami/identity-service");
const { upload } = require("../middlewares/upload.middleware");

const router = express.Router();

/**
 * POST /api/uploads/image — general image upload (editor images, cover images).
 * Returns a relative URL served by express.static.
 */
router.post(
  "/image",
  requireAuth,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new ApiError(400, "No image uploaded");
    const url = `/uploads/${req.file.filename}`;
    return sendSuccess(res, 201, { url }, "Image uploaded");
  })
);

module.exports = router;
