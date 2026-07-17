"use strict";

const express = require("express");
const { createReport } = require("../controllers/report.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", requireAuth, createReport);

module.exports = router;
