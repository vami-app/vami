"use strict";

const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/membership.controller");

// POST /api/webhooks/razorpay (HMAC raw-body signature verified)
router.post("/razorpay", handleWebhook);

module.exports = router;
