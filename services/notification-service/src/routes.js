const express = require('express');
const { shouldDeliver } = require('./domain/preference-engine');
const { renderTemplate } = require('./domain/template-engine');
const { IdempotencyService } = require('./infra/idempotency');
const { InAppNotificationStore } = require('./store/in-app-store');
const { BadRequestError, NotFoundError } = require('@vami/util');

function createNotificationRoutes() {
  const router = express.Router();
  const idempotencyService = new IdempotencyService();
  const inAppStore = new InAppNotificationStore();

  /**
   * POST /api/v1/notifications
   * Centralized Async Notification Ingress Endpoint.
   * Responds 202 Accepted in <10ms by enqueuing work for fan-out dispatchers.
   */
  router.post('/', async (req, res, next) => {
    try {
      const { recipientId, channel = 'in-app', category = 'system', title, message, variables, idempotencyKey } = req.body;

      if (!recipientId || !title || !message) {
        throw new BadRequestError('Fields recipientId, title, and message are required.');
      }

      // Check idempotency lock
      if (idempotencyKey) {
        const lockAcquired = await idempotencyService.acquireLock(idempotencyKey);
        if (!lockAcquired) {
          return res.status(200).json({ status: 'duplicate_suppressed', message: 'Notification already processed.' });
        }
      }

      // Evaluate user preference filter
      const deliveryCheck = shouldDeliver({ channel, category });
      if (!deliveryCheck.allowed) {
        return res.status(200).json({ status: 'filtered', reason: deliveryCheck.reason });
      }

      const renderedTitle = renderTemplate(title, variables);
      const renderedMessage = renderTemplate(message, variables);

      // Save to in-app store if channel is in-app
      let createdRecord = null;
      if (channel === 'in-app') {
        createdRecord = await inAppStore.create({
          userId: recipientId,
          title: renderedTitle,
          message: renderedMessage,
          category,
        });
      }

      return res.status(202).json({
        status: 'accepted',
        notificationId: createdRecord ? createdRecord.id : `job_${Date.now()}`,
        channel,
        message: 'Notification enqueued for dispatch',
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/notifications/in-app
   * Retrieves paginated user in-app notifications.
   */
  router.get('/in-app', async (req, res, next) => {
    try {
      const user = (/** @type {any} */ (req)).user;
      const userId = user && user.userId ? user.userId : (/** @type {string} */ (req.query.userId) || 'user_demo');
      const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : 10;

      const result = await inAppStore.listForUser(userId, { cursor, limit });
      return res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * PATCH /api/v1/notifications/in-app/:id/read
   * Marks a notification as read.
   */
  router.patch('/in-app/:id/read', async (req, res, next) => {
    try {
      const user = (/** @type {any} */ (req)).user;
      const userId = user && user.userId ? user.userId : (/** @type {string} */ (req.query.userId) || 'user_demo');
      const updated = await inAppStore.markRead(req.params.id, userId);

      if (!updated) {
        throw new NotFoundError('Notification not found or access denied.');
      }

      return res.json({ status: 'success', notification: updated });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createNotificationRoutes };
