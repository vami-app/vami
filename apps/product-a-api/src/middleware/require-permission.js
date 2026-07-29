const { can } = require('@vami/authz');
const { ForbiddenError } = require('@vami/util');

/**
 * Factory that returns an Express middleware enforcing a specific permission.
 *
 * Usage: `router.get('/resource', authenticate(), requirePermission('resource:read'), controller.list)`
 *
 * This must always be used AFTER `authenticate()` — it reads `req.user` which
 * is set by the auth middleware.
 *
 * @param {string} permission - permission string (e.g. 'projects:read')
 * @param {(req: any) => Record<string, any> | null} [getResourceContext]
 *   Optional function to extract resource context (ownerId, tenantId) from req.
 *   Enables ABAC: owner-level permission checks and tenant isolation.
 * @returns {(req: any, res: any, next: any) => void}
 */
function requirePermission(permission, getResourceContext) {
  return (/** @type {any} */ req, /** @type {any} */ _res, /** @type {any} */ next) => {
    const user = req.user;
    const resourceContext = typeof getResourceContext === 'function'
      ? getResourceContext(req)
      : null;

    if (!can(user, permission, resourceContext)) {
      return next(new ForbiddenError(
        `Insufficient permissions. Required: '${permission}'.`
      ));
    }

    next();
  };
}

module.exports = { requirePermission };
