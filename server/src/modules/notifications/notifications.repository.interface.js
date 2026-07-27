"use strict";

class INotificationRepository {
  async create(data) { throw new Error("not implemented"); }
  async findOwnPaginated({ userId, skip, limit }) { throw new Error("not implemented"); }
  async countOwn({ userId }) { throw new Error("not implemented"); }
  async countUnread({ userId }) { throw new Error("not implemented"); }
  async markRead({ id, userId }) { throw new Error("not implemented"); }
  async markAllRead(userId) { throw new Error("not implemented"); }
  async findRecentClapNotif({ recipient, actor, postId, windowMs }) { throw new Error("not implemented"); }
  async touchNotification(id) { throw new Error("not implemented"); }
  async deleteManyByRecipient(userId) { throw new Error("not implemented"); }
  async deleteActorNotifsExceptSoftDeletedComments({ actorId, softDeletedCommentIds }) { throw new Error("not implemented"); }
}

module.exports = INotificationRepository;
