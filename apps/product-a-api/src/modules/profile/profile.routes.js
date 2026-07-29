const express = require('express');
const { authenticate } = require('../../middleware/authenticate');
const { requirePermission } = require('../../middleware/require-permission');

/**
 * Creates the profile BFF router.
 * All profile routes require authentication.
 *
 * @param {import('@vami/registry').ServiceRegistry} registry
 * @returns {import('express').Router}
 */
function createProfileRouter(registry) {
  const { createProfileController } = require('./profile.controller');
  const controller = createProfileController(registry);

  const router = express.Router();

  // GET /api/v1/bff/profile/me — requires auth + read permission
  router.get(
    '/api/v1/bff/profile/me',
    authenticate(),
    requirePermission('users:read'),
    controller.getMyProfile
  );

  // PATCH /api/v1/bff/profile/me — requires auth + write permission
  router.patch(
    '/api/v1/bff/profile/me',
    authenticate(),
    requirePermission('users:write'),
    controller.updateMyProfile
  );

  return router;
}

module.exports = { createProfileRouter };
