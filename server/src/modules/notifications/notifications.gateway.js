"use strict";

const { emitNotificationToUser, disconnectUserSockets } = require("../../config/socket");

class NotificationGateway {
  emitNotification(recipientId, notification) {
    emitNotificationToUser(recipientId, notification);
  }

  disconnectUser(userId) {
    disconnectUserSockets(userId);
  }
}

module.exports = NotificationGateway;
