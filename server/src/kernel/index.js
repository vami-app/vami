"use strict";

const { registry, ModuleRegistry } = require("./registry");
const { eventBus, EventBus } = require("./event-bus");

module.exports = {
  registry,
  ModuleRegistry,
  eventBus,
  EventBus,
};
