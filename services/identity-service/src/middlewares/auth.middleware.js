"use strict";

const asyncHandler = require("../../../../apps/inkwell-api/src/utils/asyncHandler");
const { ApiError } = require("../../../../apps/inkwell-api/src/utils/apiResponse");
const { verifyAccessToken } = require("../utils/jwt");
const User = require("../models/User");

/**
 * Require a valid access token. Attaches the full user document to req.user.
 * @type {import('express').RequestHandler}
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies.accessToken;
  if (!token) {
    throw new ApiError(401, "Authentication required");
  }
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired session");
  }
  const user = await User.findById(payload.sub);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }
  if (user.status !== "active") {
    throw new ApiError(403, "Your account has been deactivated or banned");
  }
  req.user = user;
  next();
});

/**
 * Optionally attach req.user if a valid token is present, but never rejects.
 * Used on public endpoints that personalize output for signed-in viewers.
 * @type {import('express').RequestHandler}
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies && req.cookies.accessToken;
  if (!token) return next();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);
    if (user) {
      if (user.status === "active") {
        req.user = user;
      }
    }
  } catch (err) {
    // ignore — treat as anonymous
  }
  next();
});

/**
 * Require the authenticated user to be an admin.
 * Must be placed after requireAuth.
 * @type {import('express').RequestHandler}
 */
const requireAdmin = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required");
  }
  if (req.user.role !== "admin") {
    throw new ApiError(403, "Admin privileges required");
  }
  next();
});

module.exports = { requireAuth, optionalAuth, requireAdmin };
