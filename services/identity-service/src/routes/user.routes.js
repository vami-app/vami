"use strict";

const express = require("express");
const {
  getProfile,
  updateMe,
  uploadAvatar,
  toggleFollow,
  getBookmarks,
  requestExport,
  downloadExport,
  updateSubdomain,
  requestDeleteAccount,
  deleteAccount,
} = require("../controllers/user.controller");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");
const { validate } = require("../middlewares/validate");
const { updateSubdomainRules } = require("../validators/user.validator");
const { getUserPublicLists } = require("../controllers/readingList.controller");

const router = express.Router();

router.get("/me/bookmarks", requireAuth, getBookmarks);
router.patch("/me", requireAuth, updateMe);
router.post("/me/avatar", requireAuth, upload.single("avatar"), uploadAvatar);

router.post("/me/export/request", requireAuth, requestExport);
router.get("/me/export/download", requireAuth, downloadExport);
router.patch("/me/subdomain", requireAuth, updateSubdomainRules, validate, updateSubdomain);
router.post("/me/delete-request", requireAuth, requestDeleteAccount);
router.delete("/me", requireAuth, deleteAccount);

router.get("/:username", optionalAuth, getProfile);
router.get("/:username/lists", optionalAuth, getUserPublicLists);
router.post("/:username/follow", requireAuth, toggleFollow);

module.exports = router;

