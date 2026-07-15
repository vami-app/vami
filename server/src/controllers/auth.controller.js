"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/jwt");
const User = require("../models/User");

/**
 * Issue fresh access + refresh cookies for a user.
 * @param {import('express').Response} res
 * @param {string} userId
 */
function issueSession(res, userId) {
  const accessToken = signAccessToken(String(userId));
  const refreshToken = signRefreshToken(String(userId));
  setAuthCookies(res, { accessToken, refreshToken });
}

/**
 * POST /api/auth/register
 * @type {import('express').RequestHandler}
 */
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw new ApiError(409, `That ${field} is already taken`, [{ field, message: "Already in use" }]);
  }

  const user = await User.create({ name, username, email, password });
  issueSession(res, user._id);
  return sendSuccess(res, 201, { user: user.toPublicJSON(true) }, "Account created");
});

/**
 * POST /api/auth/login
 * @type {import('express').RequestHandler}
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, "Invalid email or password");
  }

  issueSession(res, user._id);
  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Logged in");
});

/**
 * POST /api/auth/logout
 * @type {import('express').RequestHandler}
 */
const logout = asyncHandler(async (req, res) => {
  clearAuthCookies(res);
  return sendSuccess(res, 200, null, "Logged out");
});

/**
 * POST /api/auth/refresh — rotate access (and refresh) tokens from the refresh cookie.
 * @type {import('express').RequestHandler}
 */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies && req.cookies.refreshToken;
  if (!token) throw new ApiError(401, "No refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    clearAuthCookies(res);
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    clearAuthCookies(res);
    throw new ApiError(401, "User no longer exists");
  }

  issueSession(res, user._id);
  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Session refreshed");
});

/**
 * GET /api/auth/me
 * @type {import('express').RequestHandler}
 */
const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, { user: req.user.toPublicJSON(true) });
});

module.exports = { register, login, logout, refresh, me };
