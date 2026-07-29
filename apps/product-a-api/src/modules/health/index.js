const { createHealthRouter } = require('./health.routes');

/**
 * Health AppModule.
 *
 * Registered first in the module registry so /healthz and /readyz
 * are available immediately — before other modules complete initialization.
 *
 * No services to register (stateless controller).
 *
 * @type {import('@vami/registry').AppModule}
 */
const healthModule = {
  name: 'bff.health',

  registerRoutes(app) {
    app.use(createHealthRouter());
  },
};

module.exports = { healthModule };
