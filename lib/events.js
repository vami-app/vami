/**
 * Lightweight In-Process Event Bus
 *
 * Decouples domain mutations from their side effects (media cleanup,
 * cache invalidation, audit logging). Services emit events; listeners
 * react independently — neither knows about the other.
 *
 * Usage:
 *   on('blog:deleted', async (post) => { ... });
 *   emit('blog:deleted', post);
 *
 * Note: This is an in-process singleton. In serverless environments (Vercel),
 * listeners are registered once per cold start via instrumentation.js and
 * persist for the lifetime of the warm function instance.
 */

/** @type {Map<string, Array<(payload: unknown) => void | Promise<void>>>} */
const listeners = new Map();

/**
 * Register a listener for an event.
 * @param {string} event
 * @param {(payload: unknown) => void | Promise<void>} fn
 * @returns {() => void} Unsubscribe function
 */
export function on(event, fn) {
  if (!listeners.has(event)) {
    listeners.set(event, []);
  }
  listeners.get(event).push(fn);

  // Return unsubscribe function for clean teardown in tests
  return () => off(event, fn);
}

/**
 * Remove a specific listener.
 * @param {string} event
 * @param {(payload: unknown) => void | Promise<void>} fn
 */
export function off(event, fn) {
  if (!listeners.has(event)) return;
  listeners.set(event, listeners.get(event).filter((l) => l !== fn));
}

/**
 * Emit an event to all registered listeners.
 * Errors in individual listeners are caught and logged — they do not
 * propagate to the caller or block other listeners.
 * @param {string} event
 * @param {unknown} payload
 */
export function emit(event, payload) {
  const fns = listeners.get(event);
  if (!fns || fns.length === 0) return;

  fns.forEach((fn) => {
    Promise.resolve(fn(payload)).catch((err) => {
      // Avoid importing logger here to prevent circular deps — log directly
      console.error(
        JSON.stringify({
          level: 'error',
          service: 'vami',
          message: `[EventBus] Listener error for event: ${event}`,
          error: err.message,
        })
      );
    });
  });
}

/**
 * Remove all listeners (useful in tests for clean state).
 */
export function clearAllListeners() {
  listeners.clear();
}
