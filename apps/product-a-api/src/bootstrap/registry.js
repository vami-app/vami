const { ServiceRegistry } = require('@vami/registry');
const { ModuleRegistry } = require('@vami/registry');
const { createIdentityClient } = require('../resilience/identity-client');
const { healthModule } = require('../modules/health');
const { authModule } = require('../modules/auth');
const { profileModule } = require('../modules/profile');

/**
 * Builds and returns the wired DI container and module registry.
 *
 * Returned separately from `createApp` so integration tests can inject
 * mock services before the app is assembled.
 *
 * Registration order matters:
 *   1. Cross-cutting infra services (identity-client) — no module deps
 *   2. Health module — /healthz available immediately
 *   3. Auth module — depends on bff.identity-client
 *   4. Profile module — depends on nothing initially (stub repository)
 *
 * @returns {{ serviceRegistry: ServiceRegistry, moduleRegistry: ModuleRegistry }}
 */
function buildRegistries() {
  const serviceRegistry = new ServiceRegistry();
  const moduleRegistry = new ModuleRegistry();

  // Cross-cutting infra services — registered before any domain module
  serviceRegistry.register({
    name: 'bff.identity-client',
    factory: () => createIdentityClient(),
    singleton: true,
  });

  // Domain modules — each is self-contained and independently testable
  moduleRegistry
    .register(healthModule)   // health first: /healthz available immediately
    .register(authModule)
    .register(profileModule);

  // Wire all module services into the DI container
  moduleRegistry.registerAllServices(serviceRegistry);

  return { serviceRegistry, moduleRegistry };
}

module.exports = { buildRegistries };
