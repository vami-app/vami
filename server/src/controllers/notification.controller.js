"use strict";

const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, ApiError } = require("../utils/apiResponse");
const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Fetch paginated notification inbox for current user.
 * @type {import('express').RequestHandler}
 */
const getNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || "20", 10)));
  const skip = (page - 1) * limit;

  const recipientId = req.user._id;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: recipientId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name username avatarUrl")
      .lean(),
    Notification.countDocuments({ recipient: recipientId }),
    Notification.countDocuments({ recipient: recipientId, read: false }),
  ]);

  return sendSuccess(res, 200, {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 * @type {import('express').RequestHandler}
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const notification = await Notification.findOne({
    _id: id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  notification.read = true;
  await notification.save();

  return sendSuccess(res, 200, { notification }, "Notification marked as read");
});

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for current user as read.
 * @type {import('express').RequestHandler}
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const recipientId = req.user._id;

  await Notification.updateMany(
    { recipient: recipientId, read: false },
    { $set: { read: true } }
  );

  return sendSuccess(res, 200, null, "All notifications marked as read");
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};
