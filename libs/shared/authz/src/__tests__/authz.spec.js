const { can, requirePermission, ROLES, PERMISSIONS } = require('../index');

describe('@vami/authz', () => {
  const adminUser = { userId: 'usr_admin', roles: [ROLES.ADMIN] };
  const memberUser = { userId: 'usr_member', roles: [ROLES.MEMBER] };
  const guestUser = { userId: 'usr_guest', roles: [ROLES.GUEST] };
  const superAdmin = { userId: 'usr_super', roles: [ROLES.SUPER_ADMIN] };

  describe('can() policy engine', () => {
    it('grants all permissions to SUPER_ADMIN', () => {
      expect(can(superAdmin, PERMISSIONS.USERS_DELETE)).toBe(true);
      expect(can(superAdmin, PERMISSIONS.SETTINGS_MANAGE)).toBe(true);
    });

    it('grants role-based permissions according to matrix', () => {
      expect(can(adminUser, PERMISSIONS.PROJECTS_DELETE)).toBe(true);
      expect(can(memberUser, PERMISSIONS.PROJECTS_DELETE)).toBe(false);
      expect(can(memberUser, PERMISSIONS.PROJECTS_CREATE)).toBe(true);
      expect(can(guestUser, PERMISSIONS.PROJECTS_CREATE)).toBe(false);
      expect(can(guestUser, PERMISSIONS.PROJECTS_READ)).toBe(true);
    });

    it('grants permission when user is the resource owner (ABAC)', () => {
      const resource = { ownerId: 'usr_member', title: 'My Project' };
      // memberUser does not have USERS_DELETE, but is owner of resource
      expect(can(memberUser, PERMISSIONS.PROJECTS_DELETE, resource)).toBe(true);
    });

    it('denies access when tenantId mismatches', () => {
      const userWithTenant = { userId: 'usr_t1', roles: [ROLES.ADMIN], tenantId: 'tenant_A' };
      const resourceOtherTenant = { tenantId: 'tenant_B' };

      expect(can(userWithTenant, PERMISSIONS.PROJECTS_READ, resourceOtherTenant)).toBe(false);
    });

    it('returns false for unauthenticated or malformed user objects', () => {
      expect(can(null, PERMISSIONS.PROJECTS_READ)).toBe(false);
      // @ts-ignore
      expect(can({}, PERMISSIONS.PROJECTS_READ)).toBe(false);
    });
  });

  describe('requirePermission middleware', () => {
    it('allows execution when permission check passes', () => {
      const req = { user: adminUser };
      const res = {};
      let nextCalled = false;

      const mw = requirePermission(PERMISSIONS.PROJECTS_DELETE);
      mw(req, res, (/** @type {any} */ err) => {
        expect(err).toBeUndefined();
        nextCalled = true;
      });

      expect(nextCalled).toBe(true);
    });

    it('passes ForbiddenError (403) when permission check fails', () => {
      const req = { user: memberUser };
      const res = {};
      /** @type {any} */
      let errorPassed;

      const mw = requirePermission(PERMISSIONS.PROJECTS_DELETE);
      mw(req, res, (/** @type {any} */ err) => {
        errorPassed = err;
      });

      expect(errorPassed).toBeDefined();
      expect(errorPassed.statusCode).toBe(403);
    });

    it('passes UnauthorizedError (401) when user is not attached to request', () => {
      const req = {};
      const res = {};
      /** @type {any} */
      let errorPassed;

      const mw = requirePermission(PERMISSIONS.PROJECTS_READ);
      mw(req, res, (/** @type {any} */ err) => {
        errorPassed = err;
      });

      expect(errorPassed).toBeDefined();
      expect(errorPassed.statusCode).toBe(401);
    });
  });
});
