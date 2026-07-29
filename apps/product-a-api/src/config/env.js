const { validateEnv } = require('@vami/util');

/**
 * Line-1 Boot Config Gatekeeper for Product A API.
 * Validates process.env against strict schema contract before application boot.
 */
const config = validateEnv({
  PORT: { type: 'number', default: 4000, description: 'Port number for Product A API Express server' },
  NODE_ENV: { type: 'string', default: 'development', description: 'Application environment mode' },
  LOG_LEVEL: { type: 'string', default: 'info', description: 'Structured logger verbosity level' },
  REDIS_URL: { type: 'string', default: 'redis://localhost:6379', description: 'Redis connection URI for rate limiting & session caching' },
  IDENTITY_SERVICE_URL: { type: 'string', default: 'http://localhost:5000', description: 'Identity Provider public OIDC/JWKS endpoint' },
  PAGINATION_SECRET: {
    type: 'string',
    default: 'dev-pagination-secret-32-chars-long!',
    validator: (val) => typeof val === 'string' && val.length >= 16,
    description: 'HMAC secret key for opaque cursor signatures (min 16 chars)',
  },
});

module.exports = {
  config,
};
