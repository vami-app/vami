"use strict";

const asyncHandler = require("../../utils/asyncHandler");
const { sendSuccess } = require("../../utils/apiResponse");

class NotificationController {
  constructor(notificationService) {
    this.service = notificationService;
  }

  list = asyncHandler(async (req, res) => {
    const data = await this.service.getInbox({
      userId: req.user._id,
      page: req.query.page,
      limit: req.query.limit,
    });
    return sendSuccess(res, 200, data);
  });

  markOneRead = asyncHandler(async (req, res) => {
    const notification = await this.service.markRead({
      id: req.params.id,
      userId: req.user._id,
    });
    return sendSuccess(res, 200, { notification }, "Notification marked as read");
  });

  markAllRead = asyncHandler(async (req, res) => {
    await this.service.markAllRead(req.user._id);
    return sendSuccess(res, 200, null, "All notifications marked as read");
  });
}

module.exports = NotificationController;
