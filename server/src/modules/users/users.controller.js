"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../../utils/apiResponse");
const { setAuthCookies, clearAuthCookies } = require("../../utils/jwt");

class UserController {
  constructor(userService) {
    this.service = userService;
  }

  // ─────────────────────────────────────────────────────────────
  // Auth Domain (14 Endpoints)
  // ─────────────────────────────────────────────────────────────

  register = asyncHandler(async (req, res) => {
    const { name, username, email, password } = req.body;
    const { user, accessToken, refreshToken } = await this.service.register({
      name,
      username,
      email,
      password,
    });

    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(
      res,
      201,
      { user: user.toPublicJSON(true), accessToken, refreshToken },
      "User registered successfully"
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await this.service.login({ email, password });

    setAuthCookies(res, { accessToken, refreshToken });
    return sendSuccess(
      res,
      200,
      { user: user.toPublicJSON(true), accessToken, refreshToken },
      "Login successful"
    );
  });

  logout = asyncHandler(async (req, res) => {
    clearAuthCookies(res);
    return sendSuccess(res, 200, null, "Logged out successfully");
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies && req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(401, "Refresh token required");
    }

    const { verifyRefreshToken } = require("../../utils/jwt");
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const { user, accessToken, refreshToken: newRefresh } = await this.service.refresh({
      userId: payload.sub,
    });

    setAuthCookies(res, { accessToken, refreshToken: newRefresh });
    return sendSuccess(
      res,
      200,
      { accessToken, refreshToken: newRefresh, user: user.toPublicJSON(true) },
      "Token refreshed successfully"
    );
  });

  me = asyncHandler(async (req, res) => {
    const user = await this.service.getMe(req.user._id);
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) });
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await this.service.forgotPassword({ email });
    return sendSuccess(res, 200, null, result.message);
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const result = await this.service.resetPassword({ token, newPassword });
    return sendSuccess(res, 200, null, result.message);
  });

  verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;
    const result = await this.service.verifyEmail({ token });
    return sendSuccess(res, 200, { user: result.user.toPublicJSON(true) }, result.message);
  });

  resendVerification = asyncHandler(async (req, res) => {
    const result = await this.service.resendVerification(req.user._id);
    return sendSuccess(res, 200, null, result.message);
  });

  unsubscribe = asyncHandler(async (req, res) => {
    const { token } = req.query;
    if (!token) throw new ApiError(400, "Unsubscribe token is required.");

    const { verifyUnsubscribeToken } = require("../../utils/unsubscribeToken");
    let targetUserId;
    try {
      targetUserId = verifyUnsubscribeToken(token);
    } catch (err) {
      throw new ApiError(400, "Invalid or expired unsubscribe token.");
    }

    const user = await this.service.updateMe({
      userId: targetUserId,
      fields: { emailPrefs: { allEmails: false } },
    });

    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Unsubscribed successfully.");
  });

  oauthCallback = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.redirect(`${require("../../config/env").clientUrl}/login?error=oauth_failed`);
    }

    const accessToken = signAccessToken(String(req.user._id));
    const refreshToken = signRefreshToken(String(req.user._id));

    setAuthCookies(res, { accessToken, refreshToken });
    return res.redirect(`${require("../../config/env").clientUrl}/feed`);
  });

  // ─────────────────────────────────────────────────────────────
  // Users Domain (10 Endpoints)
  // ─────────────────────────────────────────────────────────────

  getProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const viewerId = req.user ? req.user._id : null;
    const data = await this.service.getProfile({ username, viewerId });
    return sendSuccess(res, 200, data);
  });

  updateMe = asyncHandler(async (req, res) => {
    const { name, bio, themePreference, emailPrefs } = req.body;
    const user = await this.service.updateMe({
      userId: req.user._id,
      fields: { name, bio, themePreference, emailPrefs },
    });

    if (themePreference) {
      res.cookie("theme", themePreference, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      });
    }

    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Profile updated successfully.");
  });

  uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new ApiError(400, "Please upload an image file");
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    const user = await this.service.updateAvatar({
      userId: req.user._id,
      avatarUrl,
    });

    return sendSuccess(res, 200, { avatarUrl: user.avatarUrl, user: user.toPublicJSON(true) }, "Avatar updated successfully");
  });

  toggleFollow = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const result = await this.service.toggleFollow({
      requesterId: req.user._id,
      targetUsername: username,
    });

    const message = result.isFollowing ? `Following ${result.targetUser.username}` : `Unfollowed ${result.targetUser.username}`;
    return sendSuccess(res, 200, { isFollowing: result.isFollowing }, message);
  });

  getBookmarks = asyncHandler(async (req, res) => {
    const bookmarks = await this.service.getBookmarks(req.user._id);
    const viewerId = req.user._id;
    const cardPosts = bookmarks.map((p) => p.toCardJSON(viewerId));
    return sendSuccess(res, 200, { bookmarks: cardPosts });
  });

  requestExport = asyncHandler(async (req, res) => {
    const result = await this.service.requestExport(req.user._id);
    return sendSuccess(res, 200, null, result.message);
  });

  downloadExport = asyncHandler(async (req, res) => {
    await this.service.downloadExport({ userId: req.user._id, res });
  });

  updateSubdomain = asyncHandler(async (req, res) => {
    const { subdomain } = req.body;
    const user = await this.service.updateSubdomain({
      userId: req.user._id,
      subdomain,
    });

    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "Subdomain updated successfully.");
  });

  requestDeleteAccount = asyncHandler(async (req, res) => {
    const result = await this.service.requestDeleteAccount(req.user._id);
    return sendSuccess(res, 200, null, result.message);
  });

  deleteAccount = asyncHandler(async (req, res) => {
    const { token, mode } = req.body;
    const result = await this.service.deleteAccount({
      userId: req.user._id,
      token,
      mode,
      res,
    });

    return sendSuccess(res, 200, null, result.message);
  });

  // ─────────────────────────────────────────────────────────────
  // Admin Domain (4 Endpoints)
  // ─────────────────────────────────────────────────────────────

  listUsers = asyncHandler(async (req, res) => {
    const { cursor, limit, search } = req.query;
    const data = await this.service.listUsers({
      cursor,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search ? String(search).trim() : "",
    });

    return sendSuccess(res, 200, data);
  });

  updateUserRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const user = await this.service.updateUserRole({ userId: id, role });
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User role updated successfully.");
  });

  banUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await this.service.updateUserBan({ userId: id, banned: true });
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User has been banned.");
  });

  unbanUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await this.service.updateUserBan({ userId: id, banned: false });
    return sendSuccess(res, 200, { user: user.toPublicJSON(true) }, "User has been unbanned.");
  });
}

module.exports = UserController;
