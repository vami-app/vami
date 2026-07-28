/**
 * @typedef {Object} AppModule
 * @property {string} name
 * @property {(app: any) => void} [registerRoutes]
 * @property {(registry: import('./service-registry').ServiceRegistry) => void} [registerServices]
 * @property {(eventName: string, payload: any) => Promise<void> | void} [onEvent]
 */

class ModuleRegistry {
  /** @type {AppModule[]} */
  #modules = [];

  /**
   * Registers an application domain module.
   * @param {AppModule} mod
   * @returns {this}
   */
  register(mod) {
    if (!mod || !mod.name) {
      throw new Error('Module must provide a valid "name" property.');
    }
    this.#modules.push(mod);
    return this;
  }

  /**
   * Mounts HTTP routes from all registered modules onto the Express app.
   * @param {any} app
   */
  mountAll(app) {
    for (const mod of this.#modules) {
      if (typeof mod.registerRoutes === 'function') {
        mod.registerRoutes(app);
      }
    }
  }

  /**
   * Registers all module services into the central ServiceRegistry DI container.
   * @param {import('./service-registry').ServiceRegistry} registry
   */
  registerAllServices(registry) {
    for (const mod of this.#modules) {
      if (typeof mod.registerServices === 'function') {
        mod.registerServices(registry);
      }
    }
  }

  /**
   * Asynchronously dispatches an event to all registered modules using Promise.allSettled for failure isolation.
   * @param {string} eventName
   * @param {any} payload
   * @returns {Promise<PromiseSettledResult<any>[]>}
   */
  async dispatch(eventName, payload) {
    const promises = this.#modules.map((mod) => {
      if (typeof mod.onEvent === 'function') {
        return Promise.resolve().then(() => mod.onEvent(eventName, payload));
      }
      return Promise.resolve();
    });

    return Promise.allSettled(promises);
  }

  /**
   * Returns list of registered module names.
   * @returns {string[]}
   */
  getModuleNames() {
    return this.#modules.map((m) => m.name);
  }
}

module.exports = {
  ModuleRegistry,
};
