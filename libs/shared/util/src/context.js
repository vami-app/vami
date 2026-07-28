const { AsyncLocalStorage } = require('async_hooks');

/** @type {AsyncLocalStorage<RequestContext>} */
const requestContextStorage = new AsyncLocalStorage();

/**
 * @typedef {Object} RequestContext
 * @property {string} [requestId]
 * @property {string} [traceId]
 * @property {string} [tenantId]
 * @property {string} [userId]
 */

/**
 * Runs a function within an asynchronous request context.
 * All async operations started within `fn` will inherit this context.
 * @template T
 * @param {RequestContext} context
 * @param {() => T} fn
 * @returns {T}
 */
function runWithContext(context, fn) {
  return requestContextStorage.run(context, fn);
}

/**
 * Retrieves the current asynchronous request context.
 * Returns undefined if called outside of a runWithContext scope.
 * @returns {RequestContext | undefined}
 */
function getContext() {
  return requestContextStorage.getStore();
}

// requestContextStorage is intentionally NOT exported.
// Exporting the raw AsyncLocalStorage instance would allow callers to call
// .run() directly, bypassing runWithContext and creating nested contexts
// that shadow each other. Only the accessor functions form the public API.
module.exports = {
  runWithContext,
  getContext,
};
