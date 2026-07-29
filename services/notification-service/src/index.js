const { createNotificationRoutes } = require('./routes');
const { config } = require('./config/env');

/**
 * AppModule implementation for notification-service.
 * @type {import('@vami/registry/src/module-registry').AppModule}
 */
const notificationModule = {
  name: 'notification-service',
  registerRoutes(app) {
    app.use('/api/v1/notifications', createNotificationRoutes());
  },
  registerServices(registry) {
    registry.register({
      name: 'notificationService',
      singleton: true,
      factory: () => ({
        name: 'NotificationService',
        config,
      }),
    });
  },
  async onEvent(eventName, payload) {
    // React to system events (e.g. user signup, security alerts)
    if (eventName === 'user.created') {
      console.log(`[NotificationService] Sending welcome notification to user ${payload.userId}`);
    }
  },
};

module.exports = { notificationModule };
