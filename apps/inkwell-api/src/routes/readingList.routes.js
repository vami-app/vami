"use strict";

const express = require("express");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const {
  createList,
  getMine,
  getSingleList,
  updateList,
  addPostToList,
  removePostFromList,
  deleteList,
} = require("../controllers/readingList.controller");

const router = express.Router();

router.post("/", requireAuth, createList);
router.get("/mine", requireAuth, getMine);
router.get("/:username/:slug", optionalAuth, getSingleList);
router.patch("/:id", requireAuth, updateList);
router.post("/:id/posts", requireAuth, addPostToList);
router.delete("/:id/posts/:postId", requireAuth, removePostFromList);
router.delete("/:id", requireAuth, deleteList);

module.exports = router;

