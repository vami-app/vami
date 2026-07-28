/**
 * @template T
 * @typedef {{ name: string, factory: (deps: Record<string, any>) => T, dependencies?: string[], singleton?: boolean }} ServiceDefinition
 */

class ServiceRegistry {
  #definitions = new Map();
  #singletons = new Map();

  /** @param {ServiceDefinition} def */
  register(def) {
    if (this.#definitions.has(def.name)) {
      throw new Error(`Service "${def.name}" already registered — no silent overrides.`);
    }
    this.#definitions.set(def.name, def);
    return this;
  }

  /** @param {string} name @returns {any} */
  resolve(name) {
    if (this.#singletons.has(name)) return this.#singletons.get(name);
    const def = this.#definitions.get(name);
    if (!def) throw new Error(`Service "${name}" not registered.`);
    const deps = {};
    for (const dep of def.dependencies ?? []) deps[dep] = this.resolve(dep);
    const instance = def.factory(deps);
    if (def.singleton) this.#singletons.set(name, instance);
    return instance;
  }
}

module.exports = { ServiceRegistry };
