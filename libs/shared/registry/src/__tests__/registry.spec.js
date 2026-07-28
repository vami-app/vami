const { ServiceRegistry } = require('../service-registry');
const { ModuleRegistry } = require('../module-registry');

// ─── ServiceRegistry ──────────────────────────────────────────────────────────

describe('ServiceRegistry', () => {
  /** @type {ServiceRegistry} */
  let registry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  // ── Happy-path: core DI behaviour ──────────────────────────────────────────

  it('returns a fresh instance each time for transient services', () => {
    registry.register({
      name: 'logger',
      factory: () => ({ log: (/** @type {string} */ msg) => msg }),
      singleton: false,
    });

    const s1 = registry.resolve('logger');
    const s2 = registry.resolve('logger');

    expect(s1).not.toBe(s2);
    expect(s1.log('test')).toBe('test');
  });

  it('returns the same instance for singleton services', () => {
    registry.register({
      name: 'db',
      factory: () => ({ connection: 'connected' }),
      singleton: true,
    });

    const s1 = registry.resolve('db');
    const s2 = registry.resolve('db');

    expect(s1).toBe(s2);
  });

  it('recursively resolves declared dependencies', () => {
    registry.register({
      name: 'config',
      factory: () => ({ port: 3000 }),
      singleton: true,
    });

    registry.register({
      name: 'server',
      dependencies: ['config'],
      factory: (/** @type {Record<string,any>} */ deps) => ({ port: deps.config.port }),
    });

    const server = registry.resolve('server');
    expect(server.port).toBe(3000);
  });

  it('detects and reports circular dependencies', () => {
    registry.register({
      name: 'A',
      dependencies: ['B'],
      factory: (/** @type {Record<string,any>} */ deps) => deps.B,
    });

    registry.register({
      name: 'B',
      dependencies: ['A'],
      factory: (/** @type {Record<string,any>} */ deps) => deps.A,
    });

    expect(() => registry.resolve('A')).toThrow(/Circular dependency detected/);
  });

  // ── has() ──────────────────────────────────────────────────────────────────

  it('has() returns true for a registered service', () => {
    registry.register({ name: 'svc', factory: () => ({}) });
    expect(registry.has('svc')).toBe(true);
  });

  it('has() returns false for an unregistered name', () => {
    expect(registry.has('nonExistent')).toBe(false);
  });

  // ── reset() ────────────────────────────────────────────────────────────────

  it('reset() clears all definitions — resolve after reset throws', () => {
    registry.register({ name: 'svc', factory: () => ({}) });
    registry.reset();
    expect(() => registry.resolve('svc')).toThrow(/not registered/);
  });

  it('reset() clears singletons — re-registering after reset creates a new instance', () => {
    let callCount = 0;
    registry.register({
      name: 'singleton',
      factory: () => ({ n: ++callCount }),
      singleton: true,
    });

    registry.resolve('singleton');
    registry.reset();

    registry.register({
      name: 'singleton',
      factory: () => ({ n: ++callCount }),
      singleton: true,
    });

    const instance = registry.resolve('singleton');
    expect(instance.n).toBe(2); // factory was called twice total
  });

  // ── resolve() error cases ──────────────────────────────────────────────────

  it('throws a descriptive error when resolving an unregistered service', () => {
    expect(() => registry.resolve('missingService')).toThrow(/not registered/);
  });

  it('throws when registering a duplicate service name', () => {
    registry.register({ name: 'svc', factory: () => ({}) });
    expect(() =>
      registry.register({ name: 'svc', factory: () => ({}) })
    ).toThrow(/already registered/);
  });

  // ── Symbol keys ────────────────────────────────────────────────────────────

  it('supports Symbol keys for registration and resolution', () => {
    const TOKEN = Symbol('myService');
    registry.register({ name: TOKEN, factory: () => ({ value: 42 }), singleton: true });

    expect(registry.has(TOKEN)).toBe(true);
    expect(registry.resolve(TOKEN).value).toBe(42);
  });
});

// ─── ModuleRegistry ───────────────────────────────────────────────────────────

describe('ModuleRegistry', () => {
  /** @type {ModuleRegistry} */
  let modules;

  beforeEach(() => {
    modules = new ModuleRegistry();
  });

  it('dispatches events with failure isolation via Promise.allSettled', async () => {
    let handledA = false;
    let handledB = false;

    modules.register({
      name: 'moduleA',
      onEvent: (/** @type {string} */ evt) => { if (evt === 'user.created') handledA = true; },
    });

    modules.register({
      name: 'moduleB',
      onEvent: (/** @type {string} */ evt) => {
        if (evt === 'user.created') {
          handledB = true;
          throw new Error('Module B failed');
        }
      },
    });

    const results = await modules.dispatch('user.created', { id: 1 });

    expect(handledA).toBe(true);
    expect(handledB).toBe(true);
    expect(results[0].status).toBe('fulfilled');
    expect(results[1].status).toBe('rejected');
  });

  it('getModuleNames() returns the names of all registered modules in order', () => {
    modules.register({ name: 'alpha', onEvent: () => {} });
    modules.register({ name: 'beta', onEvent: () => {} });
    expect(modules.getModuleNames()).toEqual(['alpha', 'beta']);
  });

  it('mountAll() calls registerRoutes only on modules that define it', () => {
    const fakeApp = {};
    let routesMounted = false;

    modules.register({ name: 'noRoutes' }); // no registerRoutes
    modules.register({
      name: 'withRoutes',
      registerRoutes: (/** @type {any} */ app) => { routesMounted = app === fakeApp; },
    });

    modules.mountAll(fakeApp);
    expect(routesMounted).toBe(true);
  });

  it('registerAllServices() delegates to modules that define the method', () => {
    const fakeRegistry = new (require('../service-registry').ServiceRegistry)();
    let called = false;

    modules.register({ name: 'noServices' }); // no registerServices
    modules.register({
      name: 'withServices',
      registerServices: (/** @type {any} */ reg) => { called = reg === fakeRegistry; },
    });

    modules.registerAllServices(fakeRegistry);
    expect(called).toBe(true);
  });

  it('throws when registering a module without a name', () => {
    // @ts-ignore -- intentionally passing invalid module to verify runtime guard
    expect(() => modules.register({})).toThrow(/"name"/);
  });
});
