const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getPayoutLedger } = require("../controllers/ledger.controller");

router.get("/payout-ledger", requireAuth, getPayoutLedger);

module.exports = router;
