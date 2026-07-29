const { validateEnv } = require('@vami/util');

const config = validateEnv({
  NODE_ENV: { type: 'string', default: 'development' },
  REDIS_URL: { type: 'string', default: 'redis://localhost:6379' },
});

module.exports = { config };
