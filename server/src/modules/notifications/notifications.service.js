"use strict";

const { ApiError } = require("../../utils/apiResponse");

class NotificationService {
  constructor(notificationRepository, notificationGateway) {
    this.repo = notificationRepository;
    this.gateway = notificationGateway;
  }

  async createAndEmit({ recipient, actor, type, targetType, targetId }) {
    const populatedNotif = await this.repo.create({
      recipient,
      actor,
      type,
      targetType,
      targetId,
    });
    this.gateway.emitNotification(recipient, populatedNotif);
    return populatedNotif;
  }

  async getInbox({ userId, page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page || "1", 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit || "20", 10)));
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total, unreadCount] = await Promise.all([
      this.repo.findOwnPaginated({ userId, skip, limit: limitNum }),
      this.repo.countOwn({ userId }),
      this.repo.countUnread({ userId }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  async markRead({ id, userId }) {
    const notification = await this.repo.markRead({ id, userId });
    if (!notification) {
      throw new ApiError(404, "Notification not found");
    }
    return notification;
  }

  async markAllRead(userId) {
    await this.repo.markAllRead(userId);
    return true;
  }

  async notifyClap({ post, clapper }) {
    const clapperId = clapper._id || clapper;
    const authorId = post.author._id || post.author;

    if (String(clapperId) === String(authorId)) return null;

    const recentNotif = await this.repo.findRecentClapNotif({
      recipient: authorId,
      actor: clapperId,
      postId: post._id,
      windowMs: 60 * 60 * 1000,
    });

    if (recentNotif) {
      const touched = await this.repo.touchNotification(recentNotif._id);
      this.gateway.emitNotification(authorId, touched);
      return touched;
    } else {
      return this.createAndEmit({
        recipient: authorId,
        actor: clapperId,
        type: "clap",
        targetType: "post",
        targetId: post._id,
      });
    }
  }

  async notifyCommentOrReply({ recipient, actor, comment }) {
    if (String(actor) === String(recipient)) return null;

    const isReply = Boolean(comment.parentComment);
    return this.createAndEmit({
      recipient,
      actor,
      type: isReply ? "reply" : "comment",
      targetType: isReply ? "comment" : "post",
      targetId: isReply ? comment.parentComment : comment.post,
    });
  }

  async notifyFollow({ followee, follower }) {
    if (String(followee) === String(follower)) return null;

    return this.createAndEmit({
      recipient: followee,
      actor: follower,
      type: "follow",
      targetType: "user",
      targetId: followee,
    });
  }
}

module.exports = NotificationService;
