const { ServiceRegistry } = require('../service-registry');
const { ModuleRegistry } = require('../module-registry');

describe('ServiceRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new ServiceRegistry();
  });

  it('should register and resolve transient services', () => {
    registry.register({
      name: 'logger',
      factory: () => ({ log: (msg) => msg }),
      singleton: false,
    });

    const s1 = registry.resolve('logger');
    const s2 = registry.resolve('logger');

    expect(s1).not.toBe(s2);
    expect(s1.log('test')).toBe('test');
  });

  it('should cache singleton services', () => {
    registry.register({
      name: 'db',
      factory: () => ({ connection: 'connected' }),
      singleton: true,
    });

    const s1 = registry.resolve('db');
    const s2 = registry.resolve('db');

    expect(s1).toBe(s2);
  });

  it('should recursively resolve dependencies', () => {
    registry.register({
      name: 'config',
      factory: () => ({ port: 3000 }),
      singleton: true,
    });

    registry.register({
      name: 'server',
      dependencies: ['config'],
      factory: (deps) => ({ port: deps.config.port }),
    });

    const server = registry.resolve('server');
    expect(server.port).toBe(3000);
  });

  it('should detect circular dependencies', () => {
    registry.register({
      name: 'A',
      dependencies: ['B'],
      factory: (deps) => deps.B,
    });

    registry.register({
      name: 'B',
      dependencies: ['A'],
      factory: (deps) => deps.A,
    });

    expect(() => registry.resolve('A')).toThrow(/Circular dependency detected/);
  });
});

describe('ModuleRegistry', () => {
  it('should register modules and dispatch events asynchronously with error isolation', async () => {
    const modules = new ModuleRegistry();
    let handledA = false;
    let handledB = false;

    modules.register({
      name: 'moduleA',
      onEvent: (evt) => {
        if (evt === 'user.created') handledA = true;
      },
    });

    modules.register({
      name: 'moduleB',
      onEvent: (evt) => {
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
});
