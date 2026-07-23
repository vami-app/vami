"use strict";

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getPayoutLedger } = require("../controllers/ledger.controller");
const { getWriterAnalytics } = require("../controllers/analytics.controller");

router.get("/analytics", requireAuth, getWriterAnalytics);
router.get("/payout-ledger", requireAuth, getPayoutLedger);

module.exports = router;
