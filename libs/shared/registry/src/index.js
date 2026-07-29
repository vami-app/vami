const { ServiceRegistry } = require('./service-registry');
const { ModuleRegistry } = require('./module-registry');

/** @typedef {import('./module-registry').AppModule} AppModule */

module.exports = {
  ServiceRegistry,
  ModuleRegistry,
};
