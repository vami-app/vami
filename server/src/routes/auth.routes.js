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

module.exports = router;
