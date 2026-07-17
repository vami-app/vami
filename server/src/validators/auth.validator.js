"use strict";

const { body } = require("express-validator");

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 80 }),
  body("username")
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be 3–30 characters")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Username may only contain lowercase letters, numbers, and underscores"),
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotPasswordRules = [
  body("email").trim().isEmail().withMessage("A valid email is required").normalizeEmail(),
];

const resetPasswordRules = [
  body("token")
    .isHexadecimal()
    .isLength({ min: 64, max: 64 })
    .withMessage("Invalid reset token"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

module.exports = { registerRules, loginRules, forgotPasswordRules, resetPasswordRules };
