const { AuthService } = require('./auth.service');
const { createAuthRouter } = require('./auth.routes');

/** @type {import('@vami/registry').AppModule & { _registry?: any, _router?: any }} */
const authModule = {
  name: 'bff.auth',

  /**
   * Registers AuthService as a singleton in the DI container.
   * Declares dependency on 'bff.identity-client' — resolved automatically
   * by ServiceRegistry before this factory runs.
   *
   * @param {import('@vami/registry').ServiceRegistry} registry
   */
  registerServices(registry) {
    registry.register({
      name: 'bff.auth.service',
      factory: (deps) => new AuthService({ identityClient: deps['bff.identity-client'] }),
      dependencies: ['bff.identity-client'],
      singleton: true,
    });
  },

  /**
   * Mounts auth routes onto the Express application.
   * Routes resolve the ServiceRegistry to inject the auth controller.
   *
   * @param {any} app
   */
  registerRoutes(app) {
    // ServiceRegistry is captured from the module-level closure set in registerServices.
    // We use a late-binding pattern: the router receives the registry reference
    // and resolves services when the first request arrives.
    // This avoids the DI split-brain bug fixed in H6.
    app.use((/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
      // Lazy-initialize and cache the router on first request
      if (!authModule._router) {
        authModule._router = createAuthRouter(authModule._registry);
      }
      authModule._router(req, res, next);
    });
  },

  /** @type {import('@vami/registry').ServiceRegistry | null} */
  _registry: null,

  /** @type {import('express').Router | null} */
  _router: null,
};

// Patch registerServices to capture registry reference
const originalRegisterServices = authModule.registerServices ? authModule.registerServices.bind(authModule) : null;
authModule.registerServices = function (registry) {
  authModule._registry = registry;
  if (originalRegisterServices) originalRegisterServices(registry);
};

module.exports = { authModule };
