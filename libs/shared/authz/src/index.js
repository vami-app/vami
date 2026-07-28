const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('./roles');
const { can } = require('./policy');
const { requirePermission } = require('./middleware');

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  can,
  requirePermission,
};
