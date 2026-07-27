"use strict";

const Notification = require("../../models/Notification");
const { emitNotificationToUser } = require("../../config/socket");

class MongoNotificationRepository {
  async createAndEmit({ recipient, actor, type, targetType, targetId }) {
    const notif = await Notification.create({
      recipient,
      actor,
      type,
      targetType,
      targetId,
    });
    const populatedNotif = await Notification.findById(notif._id)
      .populate("actor", "name username avatarUrl")
      .lean();
    emitNotificationToUser(recipient, populatedNotif);
    return notif;
  }
}

module.exports = MongoNotificationRepository;
