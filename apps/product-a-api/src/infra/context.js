const crypto = require('crypto');
const { runWithContext } = require('@vami/util');

/**
 * Builds an Express middleware that seeds a per-request AsyncLocalStorage context.
 *
 * Context fields injected on every request:
 *   - requestId: unique UUID per request (stable across any log calls within that request)
 *   - traceId:   from X-Trace-Id header (or a new UUID if absent)
 *   - tenantId:  from X-Tenant-Id header (if present — used by authz layer)
 *
 * The ALS context is then accessible anywhere in the call stack via @vami/util `getContext()`,
 * which means the Winston logger injects these fields automatically without prop-drilling.
 *
 * @returns {(req: any, res: any, next: any) => void}
 */
function buildContextMiddleware() {
  return (/** @type {any} */ req, /** @type {any} */ _res, /** @type {any} */ next) => {
    const requestId = crypto.randomUUID();
    const traceId = req.headers['x-trace-id'] || crypto.randomUUID();
    const tenantId = req.headers['x-tenant-id'] || undefined;

    // Attach to req for downstream use (e.g. error handler logging)
    req.requestId = requestId;
    req.traceId = traceId;

    runWithContext({ requestId, traceId, tenantId }, next);
  };
}

module.exports = { buildContextMiddleware };
