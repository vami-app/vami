"use strict";

const EventEmitter = require("events");

class EventBus extends EventEmitter {
  emitEvent(eventName, payload) {
    return this.emit(eventName, payload);
  }

  subscribe(eventName, handler) {
    this.on(eventName, handler);
    return () => this.off(eventName, handler);
  }
}

const eventBus = new EventBus();

module.exports = {
  EventBus,
  eventBus,
};
