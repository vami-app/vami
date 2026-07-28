const { ROLES, ROLE_PERMISSIONS } = require('./roles');

/**
 * @typedef {Object} UserAuthContext
 * @property {string} userId
 * @property {string[]} roles
 * @property {string} [tenantId]
 */

/**
 * Evaluates whether a user has permission to perform an action on a resource.
 *
 * Evaluation Order (Fast-path to Attribute-based):
 * 1. Unauthenticated or invalid user -> false.
 * 2. SUPER_ADMIN role override -> true (instant O(1)).
 * 3. Role-Permission Matrix lookup -> true if any role grants the permission.
 * 4. ABAC / Owner check: if permission requires ownership or tenant match.
 *
 * @param {UserAuthContext | null | undefined} user
 * @param {string} permission - permission string (e.g. 'projects:update')
 * @param {Record<string, any> | null | undefined} [resourceContext] - resource data object (e.g. { ownerId, tenantId })
 * @param {Object} [options]
 * @param {(user: UserAuthContext, resource: any) => boolean} [options.customRule]
 * @returns {boolean}
 */
function can(user, permission, resourceContext, options = {}) {
  if (!user || !user.userId || !Array.isArray(user.roles)) {
    return false;
  }

  // 1. SUPER_ADMIN override — instant pass
  if (user.roles.includes(ROLES.SUPER_ADMIN)) {
    return true;
  }

  // 2. Custom rule evaluation (if provided)
  if (typeof options.customRule === 'function') {
    if (options.customRule(user, resourceContext)) {
      return true;
    }
  }

  // 3. ABAC Owner Check (if resource has ownerId matching user.userId)
  if (resourceContext && resourceContext.ownerId === user.userId) {
    return true;
  }

  // 4. Tenant isolation check (if both contexts specify tenantId and they mismatch, deny)
  if (
    user.tenantId &&
    resourceContext &&
    resourceContext.tenantId &&
    user.tenantId !== resourceContext.tenantId
  ) {
    return false;
  }

  // 5. Role-Permission Matrix check
  for (const role of user.roles) {
    const permissionsForRole = ROLE_PERMISSIONS[role];
    if (permissionsForRole && permissionsForRole.has(permission)) {
      return true;
    }
  }

  return false;
}

module.exports = {
  can,
};
