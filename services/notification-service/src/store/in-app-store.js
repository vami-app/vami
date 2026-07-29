const { encodeCursor, decodeCursor } = require('@vami/pagination');

/**
 * @typedef {Object} InAppNotification
 * @property {string} id
 * @property {string} userId
 * @property {string} title
 * @property {string} message
 * @property {'transactional' | 'marketing' | 'system'} category
 * @property {boolean} read
 * @property {number} createdAt
 */

class InAppNotificationStore {
  /** @type {Map<string, InAppNotification>} */
  #notifications = new Map();

  /**
   * Saves a new in-app notification.
   * @param {Omit<InAppNotification, 'id' | 'read' | 'createdAt'>} payload
   * @returns {Promise<InAppNotification>}
   */
  async create(payload) {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    /** @type {InAppNotification} */
    const record = {
      id,
      userId: payload.userId,
      title: payload.title,
      message: payload.message,
      category: payload.category || 'system',
      read: false,
      createdAt: Date.now(),
    };
    this.#notifications.set(id, record);
    return record;
  }

  /**
   * Retrieves paginated in-app notifications for a user using keyset cursor pagination.
   *
   * @param {string} userId
   * @param {{ cursor?: string, limit?: number }} options
   * @returns {Promise<{ items: InAppNotification[], nextCursor: string | null, totalUnread: number }>}
   */
  async listForUser(userId, { cursor, limit = 10 } = {}) {
    const userItems = Array.from(this.#notifications.values())
      .filter((n) => n.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt); // Descending by time

    const totalUnread = userItems.filter((n) => !n.read).length;

    let startIndex = 0;
    if (cursor) {
      try {
        const decoded = decodeCursor(cursor, 'dev-pagination-secret-32-chars-long!');
        const index = userItems.findIndex((item) => item.id === decoded.id);
        if (index !== -1) startIndex = index + 1;
      } catch {
        // Fallback to start if cursor invalid
      }
    }

    const items = userItems.slice(startIndex, startIndex + limit);
    let nextCursor = null;

    if (startIndex + limit < userItems.length && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = encodeCursor(
        { id: lastItem.id, sortValue: lastItem.createdAt },
        'dev-pagination-secret-32-chars-long!'
      );
    }

    return { items, nextCursor, totalUnread };
  }

  /**
   * Marks a specific notification as read.
   * @param {string} id
   * @param {string} userId
   * @returns {Promise<InAppNotification | null>}
   */
  async markRead(id, userId) {
    const record = this.#notifications.get(id);
    if (!record || record.userId !== userId) return null;
    record.read = true;
    this.#notifications.set(id, record);
    return record;
  }
}

module.exports = { InAppNotificationStore };
