"use strict";

const INotificationRepository = require("./notifications.repository.interface");
const Notification = require("./notifications.model");

const ACTOR_FIELDS = "name username avatarUrl";

class MongoNotificationRepository extends INotificationRepository {
  async create({ recipient, actor, type, targetType, targetId }) {
    const notif = await Notification.create({
      recipient,
      actor,
      type,
      targetType,
      targetId,
    });
    return Notification.findById(notif._id)
      .populate("actor", ACTOR_FIELDS)
      .lean();
  }

  async findOwnPaginated({ userId, skip = 0, limit = 20 }) {
    return Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", ACTOR_FIELDS)
      .lean();
  }

  async countOwn({ userId }) {
    return Notification.countDocuments({ recipient: userId });
  }

  async countUnread({ userId }) {
    return Notification.countDocuments({ recipient: userId, read: false });
  }

  async markRead({ id, userId }) {
    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
    });
    if (!notification) return null;
    notification.read = true;
    await notification.save();
    return notification;
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { recipient: userId, read: false },
      { $set: { read: true } }
    );
  }

  async findRecentClapNotif({ recipient, actor, postId, windowMs = 60 * 60 * 1000 }) {
    return Notification.findOne({
      recipient,
      actor,
      type: "clap",
      targetType: "post",
      targetId: postId,
      createdAt: { $gte: new Date(Date.now() - windowMs) },
    });
  }

  async touchNotification(id) {
    const notif = await Notification.findById(id);
    if (!notif) return null;
    notif.read = false;
    await notif.save();
    return Notification.findById(notif._id)
      .populate("actor", ACTOR_FIELDS)
      .lean();
  }

  async deleteManyByRecipient(userId) {
    return Notification.deleteMany({ recipient: userId });
  }

  async deleteActorNotifsExceptSoftDeletedComments({ actorId, softDeletedCommentIds }) {
    return Notification.deleteMany({
      actor: actorId,
      $or: [
        { targetType: { $ne: "comment" } },
        { targetType: "comment", targetId: { $nin: softDeletedCommentIds } },
      ],
    });
  }
}

module.exports = MongoNotificationRepository;
