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
   * Returns true if a service with the given name/symbol is registered.
   * Use this to guard optional service lookups without catching errors.
   * @param {string | symbol} name
   * @returns {boolean}
   */
  has(name) {
    return this.#definitions.has(name);
  }

  /**
   * Resolves a registered service by name/symbol.
   *
   * Circular dependency detection uses a local Set passed through the
   * recursive call stack — NOT a shared instance field — so concurrent
   * test runs and mid-resolution resets cannot corrupt resolution state.
   *
   * @template T
   * @param {string | symbol} name
   * @param {Set<string | symbol>} [_stack] - internal, do not pass from outside
   * @returns {T}
   */
  resolve(name, _stack = new Set()) {
    if (this.#singletons.has(name)) {
      return this.#singletons.get(name);
    }

    const def = this.#definitions.get(name);
    if (!def) {
      throw new Error(`Service "${String(name)}" is not registered in ServiceRegistry.`);
    }

    if (_stack.has(name)) {
      const cycle = Array.from(_stack).map(String).join(' -> ') + ' -> ' + String(name);
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    const stack = new Set(_stack);
    stack.add(name);

    /** @type {Record<string, any>} */
    const resolvedDeps = {};
    for (const depKey of def.dependencies || []) {
      resolvedDeps[String(depKey)] = this.resolve(depKey, stack);
    }

    const instance = def.factory(resolvedDeps);

    if (def.singleton) {
      this.#singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Clears all definitions and singletons.
   * Safe to call between tests — resolution stack is local per-call,
   * so reset() cannot corrupt an in-flight resolve.
   */
  reset() {
    this.#singletons.clear();
    this.#definitions.clear();
  }
}

module.exports = {
  ServiceRegistry,
};
