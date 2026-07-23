const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const {
  subscribe,
  verify,
  cancel,
} = require("../controllers/membership.controller");

router.post("/subscribe", requireAuth, subscribe);
router.post("/verify", requireAuth, verify);
router.post("/cancel", requireAuth, cancel);

module.exports = router;

