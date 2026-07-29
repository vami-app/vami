const { UserStore } = require('./user-store');
const { SessionStore } = require('./sessions');
const { KeyManager } = require('./keys');
const { createAuthRouter } = require('./routes');
const { hashPassword, verifyPassword } = require('./passwords');
const { signAccessToken, signRefreshToken } = require('./tokens');

/** @type {import('@vami/registry/src/service-registry').ServiceRegistry | null} */
let _registry = null;

/**
 * AppModule definition for Identity Service.
 * Implements the modular-monolith contract for ModuleRegistry and ServiceRegistry.
 *
 * @type {import('@vami/registry/src/module-registry').AppModule}
 */
const identityModule = {
  name: 'identity',

  /**
   * Registers Identity Service components into the central ServiceRegistry DI container.
   * @param {import('@vami/registry').ServiceRegistry} registry
   */
  registerServices(registry) {
    _registry = registry;
    const keyManager = new KeyManager();
    const userStore = new UserStore();
    const sessionStore = new SessionStore();

    registry.register({
      name: 'identity.keyManager',
      factory: () => keyManager,
      singleton: true,
    });

    registry.register({
      name: 'identity.userStore',
      factory: () => userStore,
      singleton: true,
    });

    registry.register({
      name: 'identity.sessionStore',
      factory: () => sessionStore,
      singleton: true,
    });
  },

  /**
   * Mounts identity HTTP routes onto an Express application instance.
   * @param {any} app
   */
  registerRoutes(app) {
    if (!_registry) throw new Error('identityModule.registerServices must be called before registerRoutes');
    const keyManager = _registry.resolve('identity.keyManager');
    const userStore = _registry.resolve('identity.userStore');
    const sessionStore = _registry.resolve('identity.sessionStore');

    // Fire and forget initialization for dev keypair
    keyManager.initialize().catch((/** @type {any} */ err) => {
      console.error('Failed to initialize KeyManager in identity module:', err);
    });

    const router = createAuthRouter({ keyManager, userStore, sessionStore });
    app.use(router);
  },

  /**
   * Async event handler for cross-module aggregate domain events.
   * @param {string} eventName
   * @param {any} payload
   */
  async onEvent(eventName, payload) {
    // Identity service event handlers (e.g. user.created, user.deleted)
    if (eventName === 'identity.revoke_session' && payload && payload.sessionId) {
      if (!_registry) return;
      const sessionStore = _registry.resolve('identity.sessionStore');
      await sessionStore.revokeSession(payload.sessionId, payload.jti);
    }
  },
};

module.exports = {
  identityModule,
  UserStore,
  SessionStore,
  KeyManager,
  createAuthRouter,
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
};
