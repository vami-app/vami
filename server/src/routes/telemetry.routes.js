const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middlewares/auth.middleware");
const { recordReadEvent } = require("../controllers/telemetry.controller");

router.post("/read-event", optionalAuth, recordReadEvent);

module.exports = router;
