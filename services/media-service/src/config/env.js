const { validateEnv } = require('@vami/util');

const config = validateEnv({
  NODE_ENV: { type: 'string', default: 'development' },
  MINIO_ENDPOINT: { type: 'string', default: 'http://localhost:9000' },
  MINIO_BUCKET: { type: 'string', default: 'vami-media' },
});

module.exports = { config };
