"use strict";

const express = require("express");
const {
  register,
  login,
  logout,
  refresh,
  me,
  forgotPassword,
  resetPassword,
  unsubscribe,
  verifyEmail,
  resendVerification,
  oauthCallback,
} = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate");
const { forgotPasswordLimiter } = require("../middlewares/rateLimiter");
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
} = require("../validators/auth.validator");
const passport = require("../config/passport");
const env = require("../config/env");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", requireAuth, logout);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/forgot-password", forgotPasswordLimiter, forgotPasswordRules, validate, forgotPassword);
router.post("/reset-password", resetPasswordRules, validate, resetPassword);
router.get("/unsubscribe", unsubscribe);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, resendVerification);

// OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      const msg = err ? encodeURIComponent(err.message) : "oauth_failed";
      return res.redirect(`${env.clientUrl}/login?error=${msg}`);
    }
    req.user = user;
    return oauthCallback(req, res, next);
  })(req, res, next);
});

router.get("/github", passport.authenticate("github", { scope: ["user:email"], session: false }));
router.get("/github/callback", (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err || !user) {
      const msg = err ? encodeURIComponent(err.message) : "oauth_failed";
      return res.redirect(`${env.clientUrl}/login?error=${msg}`);
    }
    req.user = user;
    return oauthCallback(req, res, next);
  })(req, res, next);
});

module.exports = router;
