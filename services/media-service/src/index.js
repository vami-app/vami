const { createMediaRoutes } = require('./routes');
const { config } = require('./config/env');

/**
 * AppModule implementation for media-service.
 * @type {import('@vami/registry/src/module-registry').AppModule}
 */
const mediaModule = {
  name: 'media-service',
  registerRoutes(app) {
    app.use('/api/v1/media', createMediaRoutes());
  },
  registerServices(registry) {
    registry.register({
      name: 'mediaService',
      singleton: true,
      factory: () => ({
        name: 'MediaService',
        config,
      }),
    });
  },
  async onEvent(eventName, payload) {
    if (eventName === 'media.uploaded') {
      console.log(`[MediaService] Processing upload completed for asset ${payload.uploadId}`);
    }
  },
};

module.exports = { mediaModule };
