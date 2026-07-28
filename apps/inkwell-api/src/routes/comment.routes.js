"use strict";

const express = require("express");
const { deleteComment } = require("../controllers/comment.controller");
const { requireAuth } = require("@vami/identity-service");

const router = express.Router();

router.delete("/:id", requireAuth, deleteComment);

module.exports = router;
