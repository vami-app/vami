/**
 * Standard system roles.
 */
const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
};

/**
 * Standard system permissions.
 */
const PERMISSIONS = {
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  PROJECTS_READ: 'projects:read',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_UPDATE: 'projects:update',
  PROJECTS_DELETE: 'projects:delete',

  MEDIA_UPLOAD: 'media:upload',
  MEDIA_DELETE: 'media:delete',

  SETTINGS_MANAGE: 'settings:manage',
};

/**
 * Default role-to-permission mapping.
 * @type {Record<string, Set<string>>}
 */
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: new Set(Object.values(PERMISSIONS)),

  [ROLES.ADMIN]: new Set([
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.PROJECTS_DELETE,
    PERMISSIONS.MEDIA_UPLOAD,
    PERMISSIONS.MEDIA_DELETE,
  ]),

  [ROLES.MEMBER]: new Set([
    PERMISSIONS.USERS_READ,
    PERMISSIONS.PROJECTS_READ,
    PERMISSIONS.PROJECTS_CREATE,
    PERMISSIONS.PROJECTS_UPDATE,
    PERMISSIONS.MEDIA_UPLOAD,
  ]),

  [ROLES.GUEST]: new Set([
    PERMISSIONS.PROJECTS_READ,
  ]),
};

/**
 * Permissions that ownership of a resource unconditionally grants.
 * Based on Zanzibar principle: ownership = a relationship that resolves
 * to a bounded set of capabilities, NOT a bypass of the system.
 * @type {Set<string>}
 */
const OWNER_PERMISSIONS = new Set([
  PERMISSIONS.PROJECTS_READ,
  PERMISSIONS.PROJECTS_UPDATE,
  PERMISSIONS.PROJECTS_DELETE,
  PERMISSIONS.MEDIA_UPLOAD,
  PERMISSIONS.MEDIA_DELETE,
]);

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  OWNER_PERMISSIONS,
};
