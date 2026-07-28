/**
 * @template T
 * @typedef {Object} ServiceDefinition
 * @property {string | symbol} name
 * @property {(deps: Record<string, any>) => T} factory
 * @property {(string | symbol)[]} [dependencies]
 * @property {boolean} [singleton]
 */

class ServiceRegistry {
  /** @type {Map<string | symbol, ServiceDefinition<any>>} */
  #definitions = new Map();
  /** @type {Map<string | symbol, any>} */
  #singletons = new Map();
  /** @type {Set<string | symbol>} */
  #resolutionStack = new Set();

  /**
   * Registers a service definition.
   * @template T
   * @param {ServiceDefinition<T>} def
   * @returns {this}
   */
  register(def) {
    if (!def.name || typeof def.factory !== 'function') {
      throw new Error('Service definition requires a valid "name" and "factory" function.');
    }
    if (this.#definitions.has(def.name)) {
      const nameStr = String(def.name);
      throw new Error(`Service "${nameStr}" is already registered in ServiceRegistry.`);
    }
    this.#definitions.set(def.name, def);
    return this;
  }

  /**
   * Resolves a registered service by name/symbol.
   * @template T
   * @param {string | symbol} name
   * @returns {T}
   */
  resolve(name) {
    if (this.#singletons.has(name)) {
      return this.#singletons.get(name);
    }

    const def = this.#definitions.get(name);
    if (!def) {
      throw new Error(`Service "${String(name)}" is not registered in ServiceRegistry.`);
    }

    if (this.#resolutionStack.has(name)) {
      const cycle = Array.from(this.#resolutionStack).map(String).join(' -> ') + ' -> ' + String(name);
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    this.#resolutionStack.add(name);

    try {
      /** @type {Record<string, any>} */
      const resolvedDeps = {};
      for (const depKey of def.dependencies || []) {
        resolvedDeps[String(depKey)] = this.resolve(depKey);
      }

      const instance = def.factory(resolvedDeps);

      if (def.singleton) {
        this.#singletons.set(name, instance);
      }

      return instance;
    } finally {
      this.#resolutionStack.delete(name);
    }
  }

  /**
   * Clears singletons (useful for test resets).
   */
  reset() {
    this.#singletons.clear();
    this.#definitions.clear();
    this.#resolutionStack.clear();
  }
}

module.exports = {
  ServiceRegistry,
};
