const express = require('express');
const cookieParser = require('cookie-parser');
const { buildHelmet, buildCors } = require('../infra/security');
const { buildContextMiddleware } = require('../infra/context');
const { errorHandler } = require('../infra/error-handler');
const { buildRegistries } = require('./registry');

/**
 * Creates and returns a fully-configured Express application.
 *
 * Middleware order is MANDATORY and must not be changed:
 *   1. helmet        — security headers, always first
 *   2. cors          — must come before any route handler
 *   3. cookieParser  — before auth middleware reads cookies
 *   4. json parser   — before route handlers read body
 *   5. context       — ALS requestId/traceId into every log
 *   6. modules       — domain routes mount here
 *   7. 404 catch-all — after all routes
 *   8. errorHandler  — must be last; 4-arg signature mandatory
 *
 * @returns {{ app: import('express').Application, serviceRegistry: any, moduleRegistry: any }}
 */
function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  const { serviceRegistry, moduleRegistry } = buildRegistries();

  // 1. Security headers
  app.use(buildHelmet());

  // 2. CORS
  app.use(buildCors());

  // 3. Cookie parsing (before auth middleware reads httpOnly cookies)
  app.use(cookieParser());

  // 4. Body parsing — 100kb limit prevents payload-based DoS
  app.use(express.json({ limit: '100kb' }));

  // 5. ALS request context: requestId + traceId injected into every downstream log
  app.use(buildContextMiddleware());

  // 6. Domain modules mount their own routers
  moduleRegistry.mountAll(app);

  // 7. 404 catch-all (must come AFTER moduleRegistry.mountAll)
  app.use((/** @type {any} */ _req, /** @type {any} */ res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'The requested resource does not exist.' });
  });

  // 8. Centralized error handler — must be last and must have exactly 4 args
  app.use(errorHandler);

  return { app, serviceRegistry, moduleRegistry };
}

module.exports = { createApp };
