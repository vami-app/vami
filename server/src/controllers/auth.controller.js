"use strict";

const crypto = require("crypto");

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require("../utils/jwt");
const { sendEmail } = require("../utils/email");
const { passwordResetEmail, verifyEmailEmail } = require("../utils/emailTemplates");
const { verifyUnsubscribeToken } = require("../utils/unsubscribeToken");
const env = require("../config/env");
const User = require("../models/User");

const RESET_TOKEN_TTL_MINUTES = 30;

/**
 * SHA-256 a reset token for at-rest storage/lookup. The raw token only ever
 * exists in the email link; a DB leak exposes nothing usable.
 * @param {string} token
 * @returns {string}
 */
function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    username,
    email,
    password,
    emailVerifyTokenHash: hash,
    emailVerifyExpiresAt: expiresAt,
  });

  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  sendEmail({
    to: user.email,
    ...verifyEmailEmail({
      name: user.name,
      verifyUrl,
      ttlHours: 24,
    }),
  }).catch((err) => console.error("[register] verification email failed:", err.message));

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

/**
 * POST /api/auth/forgot-password
 * Always responds identically whether or not the email exists, so the
 * endpoint can't be used to enumerate accounts.
 * @type {import('express').RequestHandler}
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const genericMessage =
    "If an account exists for that email, a reset link has been sent.";

  const user = await User.findOne({ email });
  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpiresAt = new Date(
      Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password?token=${rawToken}`;
    try {
      await sendEmail({
        to: user.email,
        ...passwordResetEmail({
          name: user.name,
          resetUrl,
          ttlMinutes: RESET_TOKEN_TTL_MINUTES,
        }),
      });
    } catch (err) {
      // Never leak send failures to the caller — same response either way.
      console.error("[forgot-password] email send failed:", err.message);
    }
  }

  return sendSuccess(res, 200, null, genericMessage);
});

/**
 * POST /api/auth/reset-password
 * Consumes a single-use token from the email link and sets a new password.
 * @type {import('express').RequestHandler}
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+password");

  if (!user) {
    throw new ApiError(400, "This reset link is invalid or has expired. Please request a new one.");
  }

  user.password = password; // hashed by the pre-save hook
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  issueSession(res, user._id);
  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Password updated");
});

/**
 * GET /api/auth/unsubscribe — one-click unsubscribe.
 * @type {import('express').RequestHandler}
 */
const unsubscribe = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Unsubscribe token is required");

  let userId;
  try {
    userId = verifyUnsubscribeToken(token);
  } catch (err) {
    throw new ApiError(400, "Invalid or expired unsubscribe token");
  }

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.emailPrefs) {
    user.emailPrefs = { allEmails: true, digestFrequency: "weekly" };
  }
  user.emailPrefs.allEmails = false;
  await user.save();

  res.setHeader("Content-Type", "text/html");
  return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed — Inkwell</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px; background-color: #f6f5f1; color: #1a1a1a; }
        .card { max-width: 480px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        h1 { font-size: 24px; margin-bottom: 16px; }
        p { font-size: 15px; color: #555; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>You've been unsubscribed</h1>
        <p>You will no longer receive stories or newsletter emails from Inkwell. You can update your settings at any time from your profile settings.</p>
      </div>
    </body>
    </html>
  `);
});

/**
 * GET /api/auth/verify-email
 * Verifies email verify token.
 * @type {import('express').RequestHandler}
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) throw new ApiError(400, "Verification token is required");

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    emailVerifyTokenHash: hash,
    emailVerifyExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new ApiError(400, "This verification link is invalid or has expired. Please request a new one.");
  }

  user.emailVerified = true;
  user.emailVerifyTokenHash = undefined;
  user.emailVerifyExpiresAt = undefined;
  await user.save();

  return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Email verified successfully");
});

/**
 * POST /api/auth/resend-verification
 * Regenerates verify token and resends email.
 * @type {import('express').RequestHandler}
 */
const resendVerification = asyncHandler(async (req, res) => {
  const user = req.user;
  if (user.emailVerified) {
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Email is already verified");
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerifyTokenHash = hash;
  user.emailVerifyExpiresAt = expiresAt;
  await user.save();

  const verifyUrl = `${env.clientUrl}/verify-email?token=${rawToken}`;
  try {
    await sendEmail({
      to: user.email,
      ...verifyEmailEmail({
        name: user.name,
        verifyUrl,
        ttlHours: 24,
      }),
    });
  } catch (err) {
    console.error("[resend-verification] email send failed:", err.message);
    throw new ApiError(500, "Could not send verification email. Please try again later.");
  }

  return sendSuccess(res, 200, null, "Verification email resent successfully");
});

module.exports = { register, login, logout, refresh, me, forgotPassword, resetPassword, unsubscribe, verifyEmail, resendVerification };
