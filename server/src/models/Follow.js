"use strict";

// Bridge shim — canonical definition lives in the users module (Phase H Step 10).
// All existing require("../models/Follow") call-sites continue to resolve correctly.
module.exports = require("../modules/users/follow.model");
