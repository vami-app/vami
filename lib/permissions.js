/**
 * Atomic Permissions Registry
 * FAANG standard: Authorization maps to permissions, not rigid roles.
 */
export const PERMISSIONS = {
  MANAGE_PRODUCTS: 'manage_products',
  MANAGE_CATEGORIES: 'manage_categories',
  MANAGE_BLOG: 'manage_blog',
  MANAGE_ADMINS: 'manage_admins',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_DASHBOARD: 'view_dashboard',
  MANAGE_MEDIA: 'manage_media'
};

/**
 * Roles purely exist to group permissions for easier assignment in the DB.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  EDITOR: 'EDITOR' // e.g. Content Marketing Team
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EDITOR]: [
    PERMISSIONS.MANAGE_PRODUCTS, 
    PERMISSIONS.MANAGE_CATEGORIES, 
    PERMISSIONS.MANAGE_BLOG,
    PERMISSIONS.MANAGE_MEDIA,
    PERMISSIONS.VIEW_DASHBOARD
  ]
};

/**
 * Validates if a decoded JWT payload contains the required permission.
 * Executes in O(1) time without hitting the database.
 */
export const hasPermission = (decodedToken, permission) => {
  if (!decodedToken || !decodedToken.permissions) return false;
  return decodedToken.permissions.includes(permission);
};
