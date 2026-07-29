const express = require('express');
const { healthController } = require('./health.controller');

/**
 * Creates the health check router.
 * No authentication required — health endpoints must be reachable
 * before any auth context is established.
 * @returns {import('express').Router}
 */
function createHealthRouter() {
  const router = express.Router();
  router.get('/healthz', healthController.liveness);
  router.get('/readyz', healthController.readiness);
  return router;
}

module.exports = { createHealthRouter };
