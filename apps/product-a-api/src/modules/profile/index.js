const { ProfileService } = require('./profile.service');
const { ProfileRepository } = require('./profile.repository');
const { createProfileRouter } = require('./profile.routes');

/** @type {import('@vami/registry').AppModule & { _registry: any, _router: any }} */
const profileModule = {
  name: 'bff.profile',

  /**
   * Registers ProfileRepository and ProfileService as singletons.
   * Repository has no external dependencies (stub in Phase 3).
   * In Phase 4, 'bff.profile.repository' will be replaced with a Postgres adapter.
   *
   * @param {import('@vami/registry').ServiceRegistry} registry
   */
  registerServices(registry) {
    profileModule._registry = registry;

    registry.register({
      name: 'bff.profile.repository',
      factory: () => new ProfileRepository(),
      singleton: true,
    });

    registry.register({
      name: 'bff.profile.service',
      factory: (deps) => new ProfileService({ profileRepository: deps['bff.profile.repository'] }),
      dependencies: ['bff.profile.repository'],
      singleton: true,
    });
  },

  /**
   * Mounts profile routes using late-binding pattern.
   * @param {any} app
   */
  registerRoutes(app) {
    app.use((/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
      if (!profileModule._router) {
        profileModule._router = createProfileRouter(profileModule._registry);
      }
      profileModule._router(req, res, next);
    });
  },

  _registry: /** @type {any} */ (null),
  _router: /** @type {any} */ (null),
};

module.exports = { profileModule };
