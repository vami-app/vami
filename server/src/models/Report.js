"use strict";

// Bridge shim — canonical definition lives in the moderation module (Phase H Step 10).
// All existing require("../models/Report") call-sites continue to resolve correctly.
module.exports = require("../modules/moderation/report.model");
