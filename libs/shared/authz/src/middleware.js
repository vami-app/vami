const { can } = require('./policy');
const { ForbiddenError, UnauthorizedError } = require('@vami/util');

/**
 * Express middleware to enforce fine-grained authorization policies.
 *
 * @param {string} permission - permission string required (e.g. 'projects:delete')
 * @param {(req: any) => any} [resourceResolver] - optional getter for resource context from request
 * @returns {(req: any, res: any, next: any) => void}
 */
function requirePermission(permission, resourceResolver) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required prior to permission check.'));
    }

    const resourceContext = typeof resourceResolver === 'function' ? resourceResolver(req) : req.resource;

    const allowed = can(req.user, permission, resourceContext);
    if (!allowed) {
      return next(new ForbiddenError(`Access denied: missing required permission "${permission}".`));
    }

    next();
  };
}

module.exports = {
  requirePermission,
};
