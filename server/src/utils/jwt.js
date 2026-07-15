"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * @typedef {Object} TokenPayload
 * @property {string} sub - user id
 */

/**
 * Sign a short-lived access token.
 * @param {string} userId
 * @returns {string}
 */
function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  });
}

/**
 * Sign a longer-lived refresh token.
 * @param {string} userId
 * @returns {string}
 */
function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {TokenPayload}
 */
function verifyAccessToken(token) {
  return /** @type {TokenPayload} */ (jwt.verify(token, env.jwtAccessSecret));
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {TokenPayload}
 */
function verifyRefreshToken(token) {
  return /** @type {TokenPayload} */ (jwt.verify(token, env.jwtRefreshSecret));
}

// Cookie max-age helpers (ms)
const ACCESS_COOKIE_MAXAGE = 15 * 60 * 1000; // 15 min
const REFRESH_COOKIE_MAXAGE = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Base cookie options shared by access + refresh cookies.
 * @returns {import('express').CookieOptions}
 */
function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: "lax",
    path: "/",
  };
}

/**
 * Set access + refresh token cookies on the response.
 * @param {import('express').Response} res
 * @param {{ accessToken: string, refreshToken: string }} tokens
 */
function setAuthCookies(res, { accessToken, refreshToken }) {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions(),
    maxAge: ACCESS_COOKIE_MAXAGE,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions(),
    maxAge: REFRESH_COOKIE_MAXAGE,
  });
}

/**
 * Clear auth cookies (logout).
 * @param {import('express').Response} res
 */
function clearAuthCookies(res) {
  const opts = baseCookieOptions();
  res.clearCookie("accessToken", opts);
  res.clearCookie("refreshToken", opts);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
