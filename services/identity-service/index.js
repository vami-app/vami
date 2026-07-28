"use strict";

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const User = require("./src/models/User");
const passport = require("./src/config/passport");
const { authenticate, requireAdmin } = require("./src/middlewares/auth.middleware");
const { signToken, verifyToken } = require("./src/utils/jwt");

/** @type {import('../../libs/shared/registry/module-registry').AppModule} */
module.exports = {
  name: "identity",
  registerRoutes(app) {
    const authRoutes = require("./src/routes/auth.routes");
    const userRoutes = require("./src/routes/user.routes");
    const { authLimiter } = require("../../libs/shared/middlewares/rateLimiter");

    app.use("/api/auth", authLimiter, authRoutes);
    app.use("/api/users", userRoutes);
  },
  // Public Identity Contract
  User,
  passport,
  authenticate,
  requireAdmin,
  signToken,
  verifyToken,
};
