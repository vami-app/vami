"use strict";

const express = require("express");
const {
  getProfile,
  updateMe,
  uploadAvatar,
  toggleFollow,
  getBookmarks,
} = require("../controllers/user.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

const router = express.Router();

router.get("/me/bookmarks", requireAuth, getBookmarks);
router.patch("/me", requireAuth, updateMe);
router.post("/me/avatar", requireAuth, upload.single("avatar"), uploadAvatar);

router.get("/:username", optionalAuth, getProfile);
router.post("/:username/follow", requireAuth, toggleFollow);

module.exports = router;
