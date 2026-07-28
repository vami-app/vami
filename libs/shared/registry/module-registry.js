/**
 * @typedef {{
 *   name: string,
 *   registerRoutes?: (app: import('express').Express) => void,
 *   registerServices?: (registry: import('./service-registry').ServiceRegistry) => void,
 *   onEvent?: (eventName: string, payload: unknown) => Promise<void> | void
 * }} AppModule
 */

class ModuleRegistry {
  /** @type {AppModule[]} */
  #modules = [];

  /** @param {AppModule} mod */
  register(mod) {
    if (this.#modules.some((m) => m.name === mod.name)) {
      throw new Error(`Module "${mod.name}" already registered.`);
    }
    this.#modules.push(mod);
    return this;
  }

  /** @param {import('express').Express} app */
  mountAll(app) {
    for (const m of this.#modules) m.registerRoutes?.(app);
  }

  /** @param {import('./service-registry').ServiceRegistry} registry */
  registerAllServices(registry) {
    for (const m of this.#modules) m.registerServices?.(registry);
  }

  /** @param {string} eventName @param {unknown} payload */
  async dispatch(eventName, payload) {
    return Promise.allSettled(
      this.#modules.map(async (m) => {
        if (m.onEvent) {
          await m.onEvent(eventName, payload);
        }
      })
    );
  }
}

module.exports = { ModuleRegistry };
