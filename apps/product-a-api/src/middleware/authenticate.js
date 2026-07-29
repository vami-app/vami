const { authenticate: authClientAuthenticate } = require('@vami/auth-client');
const Redis = /** @type {any} */ (require('ioredis'));

/**
 * Lazily-created Redis client for jti revocation lookups.
 * Fail-open: if Redis is unavailable, tokens are NOT rejected.
 * This is the correct trade-off for a 15-minute access token — availability
 * over strict revocation during Redis outages.
 * @type {any}
 */
let _revocationRedis = null;

function getRevocationRedis() {
  if (_revocationRedis && _revocationRedis.status !== 'end') return _revocationRedis;
  _revocationRedis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  _revocationRedis.on('error', () => { /* silent — fail open */ });
  _revocationRedis.connect().catch(() => {});
  return _revocationRedis;
}

/**
 * Checks whether a jti has been revoked via the shared Redis blocklist.
 * Returns false (not revoked) if Redis is unavailable (fail-open).
 * @param {string} jti
 * @returns {Promise<boolean>}
 */
async function checkRevoked(jti) {
  try {
    const client = getRevocationRedis();
    const result = await client.get(`identity:revoked:${jti}`);
    return result !== null;
  } catch {
    // Fail open — do not reject tokens during Redis outages
    return false;
  }
}

/**
 * BFF authentication middleware.
 *
 * Thin wrapper around `@vami/auth-client`'s `authenticate` factory so the BFF
 * doesn't need to know about the underlying token verification strategy.
 *
 * On success: sets `req.user = { userId, email, roles, jti, sessionId, tenantId, exp }`.
 * On failure (if required): passes an UnauthorizedError to next().
 * jti revocation is checked via Redis blocklist (same blocklist identity-service writes to).
 *
 * @param {{ required?: boolean }} [options]
 * @returns {(req: any, res: any, next: any) => Promise<void>}
 */
function authenticate(options = {}) {
  return authClientAuthenticate({
    required: options.required !== false,
    issuer: process.env.IDENTITY_ISSUER || 'vami-identity',
    audience: process.env.IDENTITY_AUDIENCE || 'vami-platform',
    jwksUrl: process.env.IDENTITY_JWKS_URL || 'http://localhost:5000/.well-known/jwks.json',
    checkRevoked,
  });
}

module.exports = { authenticate };
