const express = require('express');
const { UnauthorizedError } = require('@vami/util');
const { authenticate } = require('../../middleware/authenticate');
const { createLoginLimiter } = require('../../infra/rate-limit');

/**
 * Creates the auth BFF router.
 *
 * Routes are namespaced under /api/v1/bff/auth to distinguish
 * BFF endpoints from identity-service's own /api/v1/auth endpoints.
 *
 * @param {import('@vami/registry').ServiceRegistry} registry
 * @returns {import('express').Router}
 */
function createAuthRouter(registry) {
  const { createAuthController } = require('./auth.controller');
  const controller = createAuthController(registry);

  const router = express.Router();

  const loginLimiter = createLoginLimiter();

  // POST /api/v1/bff/auth/login — rate limited, no auth required
  router.post('/api/v1/bff/auth/login', loginLimiter, controller.login);

  // POST /api/v1/bff/auth/register — registration
  router.post('/api/v1/bff/auth/register', controller.register);

  // POST /api/v1/bff/auth/logout — must be authenticated (prevent anonymous session revocation)
  router.post('/api/v1/bff/auth/logout', authenticate(), controller.logout);

  // GET /api/v1/bff/auth/me — must be authenticated (IDOR-safe: userId from token, not query)
  router.get('/api/v1/bff/auth/me', authenticate(), controller.me);

  return router;
}

module.exports = { createAuthRouter };
