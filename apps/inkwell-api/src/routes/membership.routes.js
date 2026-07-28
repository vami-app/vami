const express = require("express");
const router = express.Router();
const { requireAuth } = require("@vami/identity-service");
const {
  subscribe,
  verify,
  cancel,
  testSign,
} = require("../controllers/membership.controller");

router.post("/subscribe", requireAuth, subscribe);
router.post("/verify", requireAuth, verify);
router.post("/cancel", requireAuth, cancel);
// Test-mode only — generates HMAC server-side; blocked in production
router.post("/test-sign", requireAuth, testSign);

module.exports = router;

