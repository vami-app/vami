"use strict";

const express = require("express");
const { requireAuth, optionalAuth } = require("../middlewares/auth.middleware");
const {
  createList,
  getMine,
  getUserPublicLists,
  getSingleList,
  updateList,
  addPostToList,
  removePostFromList,
  deleteList,
} = require("../controllers/readingList.controller");

const router = express.Router();

router.post("/lists", requireAuth, createList);
router.get("/lists/mine", requireAuth, getMine);
router.get("/users/:username/lists", optionalAuth, getUserPublicLists);
router.get("/lists/:username/:slug", optionalAuth, getSingleList);
router.patch("/lists/:id", requireAuth, updateList);
router.post("/lists/:id/posts", requireAuth, addPostToList);
router.delete("/lists/:id/posts/:postId", requireAuth, removePostFromList);
router.delete("/lists/:id", requireAuth, deleteList);

module.exports = router;
