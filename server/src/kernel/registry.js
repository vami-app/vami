"use strict";

class ModuleRegistry {
  constructor() {
    this.modules = new Map();
  }

  /**
   * Register a domain module
   * @param {string} name
   * @param {Object} moduleInstance
   */
  register(name, moduleInstance) {
    if (this.modules.has(name)) {
      throw new Error(`Module '${name}' is already registered.`);
    }
    this.modules.set(name, moduleInstance);
  }

  /**
   * Boot all registered modules into the Express application
   * @param {import("express").Application} app
   */
  boot(app) {
    for (const [name, moduleInstance] of this.modules.entries()) {
      if (typeof moduleInstance.boot === "function") {
        moduleInstance.boot(app);
      }
    }
  }

  /**
   * Get a registered module by name
   * @param {string} name
   */
  get(name) {
    const mod = this.modules.get(name);
    if (!mod) {
      throw new Error(`Module '${name}' not found in registry.`);
    }
    return mod;
  }
}

const registry = new ModuleRegistry();

module.exports = {
  ModuleRegistry,
  registry,
};
