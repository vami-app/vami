const { validateEnv } = require('@vami/util');

/**
 * Line-1 Boot Config Gatekeeper for Single Identity Service.
 * Validates process.env against OIDC/OAuth2 Provider requirements.
 */
const config = validateEnv({
  PORT: { type: 'number', default: 5000, description: 'Port number for Identity Service Express server' },
  NODE_ENV: { type: 'string', default: 'development', description: 'Application environment mode' },
  LOG_LEVEL: { type: 'string', default: 'info', description: 'Structured logger verbosity level' },
  REDIS_URL: { type: 'string', default: 'redis://localhost:6379', description: 'Redis connection URI for session storage and revocation' },
  RSA_KEY_SIZE: { type: 'number', default: 2048, description: 'RSA Key size for JWT signing (minimum 2048 bit)' },
  ISSUER_URL: { type: 'string', default: 'http://localhost:5000', description: 'Canonical OIDC Issuer URL' },
});

module.exports = {
  config,
};
