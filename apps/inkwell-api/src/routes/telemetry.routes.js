const express = require("express");
const router = express.Router();
const { optionalAuth } = require("@vami/identity-service");
const { recordReadEvent } = require("../controllers/telemetry.controller");

router.post("/read-event", optionalAuth, recordReadEvent);

module.exports = router;
