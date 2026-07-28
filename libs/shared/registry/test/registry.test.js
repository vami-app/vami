const { ServiceRegistry } = require('../service-registry');
const { ModuleRegistry } = require('../module-registry');

describe('ServiceRegistry', () => {
  it('registers and resolves a simple service', () => {
    const reg = new ServiceRegistry();
    reg.register({ name: 'greeter', factory: () => ({ hi: () => 'hello' }) });
    expect(reg.resolve('greeter').hi()).toBe('hello');
  });

  it('throws on duplicate registration', () => {
    const reg = new ServiceRegistry();
    reg.register({ name: 'x', factory: () => ({}) });
    expect(() => reg.register({ name: 'x', factory: () => ({}) })).toThrow(/already registered/);
  });

  it('throws when resolving an unregistered service', () => {
    const reg = new ServiceRegistry();
    expect(() => reg.resolve('missing')).toThrow(/not registered/);
  });

  it('resolves dependencies recursively', () => {
    const reg = new ServiceRegistry();
    reg.register({ name: 'a', factory: () => 'valueA' });
    reg.register({ name: 'b', dependencies: ['a'], factory: (deps) => `b-uses-${deps.a}` });
    expect(reg.resolve('b')).toBe('b-uses-valueA');
  });

  it('caches singletons, does not cache transients', () => {
    const reg = new ServiceRegistry();
    let calls = 0;
    reg.register({ name: 'single', singleton: true, factory: () => ({ id: ++calls }) });
    reg.register({ name: 'multi', factory: () => ({ id: ++calls }) });
    expect(reg.resolve('single')).toBe(reg.resolve('single'));
    expect(reg.resolve('multi')).not.toBe(reg.resolve('multi'));
  });
});

describe('ModuleRegistry', () => {
  it('mounts routes from all registered modules', () => {
    const mockApp = { use: vi.fn() };
    const modA = { name: 'a', registerRoutes: (app) => app.use('/a', () => {}) };
    const modB = { name: 'b', registerRoutes: (app) => app.use('/b', () => {}) };
    new ModuleRegistry().register(modA).register(modB).mountAll(mockApp);
    expect(mockApp.use).toHaveBeenCalledTimes(2);
  });

  it('throws on duplicate module name', () => {
    const reg = new ModuleRegistry();
    reg.register({ name: 'dup' });
    expect(() => reg.register({ name: 'dup' })).toThrow(/already registered/);
  });

  it('dispatches events to every module, isolating failures', async () => {
    const seen = [];
    const good = { name: 'good', onEvent: (e, p) => seen.push([e, p]) };
    const bad = { name: 'bad', onEvent: () => { throw new Error('boom'); } };
    const reg = new ModuleRegistry().register(good).register(bad);
    await expect(reg.dispatch('ping', { x: 1 })).resolves.toBeDefined();
    expect(seen).toEqual([['ping', { x: 1 }]]);
  });
});
