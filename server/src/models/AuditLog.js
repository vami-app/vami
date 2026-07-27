"use strict";

// Bridge shim — canonical definition lives in the moderation module (Phase H Step 10).
// All existing require("../models/AuditLog") call-sites continue to resolve correctly.
// Note: AuditLog records are preserved on account deletion (compliance-record pattern).
module.exports = require("../modules/moderation/audit-log.model");
