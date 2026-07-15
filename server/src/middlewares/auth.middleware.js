"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/apiResponse");
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
    if (user) req.user = user;
  } catch (err) {
    // ignore — treat as anonymous
  }
  next();
});

module.exports = { requireAuth, optionalAuth };
