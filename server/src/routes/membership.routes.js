const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  subscribe,
  verify,
  cancel,
  handleWebhook,
} = require("../controllers/membership.controller");

router.post("/membership/subscribe", requireAuth, subscribe);
router.post("/membership/verify", requireAuth, verify);
router.post("/membership/cancel", requireAuth, cancel);
router.post("/webhooks/razorpay", handleWebhook);

module.exports = router;
