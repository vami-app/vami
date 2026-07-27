"use strict";

const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for auth routes — mitigates brute-force / credential stuffing.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.MemoryStore(), // Sliding-window memory store (§4.8)
  message: {
    success: false,
    message: "Too many attempts. Please try again later.",
  },
});

/**
 * Tight limiter for password-reset requests — each one triggers an outbound
 * email, so the ceiling is much lower than for login attempts.
 */
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 reset emails per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.MemoryStore(), // Sliding-window memory store (§4.8)
  message: {
    success: false,
    message: "Too many reset requests. Please try again later.",
  },
});

/**
 * Generous general limiter to protect the API from abuse.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  store: new rateLimit.MemoryStore(), // Sliding-window memory store (§4.8)
});

module.exports = { authLimiter, forgotPasswordLimiter, generalLimiter };
