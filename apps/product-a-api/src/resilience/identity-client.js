const CircuitBreaker = require('opossum');
const { ServiceUnavailableError, createLogger } = require('@vami/util');

const logger = createLogger({ serviceName: 'product-a-api:identity-client' });

const BASE_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:5000';

/**
 * Standard opossum circuit breaker options for identity-service calls.
 *
 * Tuning rationale (aligned with Google SRE practices):
 *   - timeout: 3s — identity calls should be fast; 3s indicates degradation
 *   - errorThresholdPercentage: 50% — open circuit when half of calls fail
 *   - resetTimeout: 30s — try half-open after 30s to allow recovery
 *   - volumeThreshold: 5 — need at least 5 calls before statistics are meaningful
 *
 * @type {import('opossum').Options}
 */
const BREAKER_OPTS = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30_000,
  volumeThreshold: 5,
};

/**
 * Wraps an async function in a circuit breaker.
 * Fallback throws ServiceUnavailableError (HTTP 503) so callers receive a
 * structured error — not a hanging connection or unhandled rejection.
 *
 * @param {Function} fn
 * @param {string} name - human-readable breaker name for logging
 * @returns {CircuitBreaker}
 */
function makeBreakerFor(fn, name) {
  const breaker = new CircuitBreaker(fn, BREAKER_OPTS);

  breaker.fallback(() => {
    throw new ServiceUnavailableError(`Identity service temporarily unavailable (circuit: ${name})`);
  });

  breaker.on('open', () =>
    logger.warn(`Circuit OPEN — identity-service failing`, { circuit: name })
  );
  breaker.on('halfOpen', () =>
    logger.info(`Circuit HALF-OPEN — testing identity-service`, { circuit: name })
  );
  breaker.on('close', () =>
    logger.info(`Circuit CLOSED — identity-service recovered`, { circuit: name })
  );

  return breaker;
}

/**
 * Performs a POST to the identity-service with JSON body.
 * @param {string} path
 * @param {Record<string, any>} body
 * @returns {Promise<any>}
 */
async function identityPost(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`identity-service ${path} failed: ${res.status} ${text}`);
  }

  return res.json();
}

/**
 * Creates the identity-service HTTP client with per-operation circuit breakers.
 *
 * Each operation gets its own breaker so a login storm does not open the
 * profile breaker, and vice versa.
 *
 * @returns {{
 *   login: (creds: { email: string, password: string }) => Promise<any>,
 *   logout: (params: { jti?: string, sessionId?: string }) => Promise<any>,
 *   getProfile: (userId: string) => Promise<any>,
 * }}
 */
function createIdentityClient() {
  const loginBreaker = makeBreakerFor(
    (/** @type {{ email: string, password: string }} */ creds) =>
      identityPost('/api/v1/auth/login', creds),
    'login'
  );

  const logoutBreaker = makeBreakerFor(
    (/** @type {{ jti?: string, sessionId?: string }} */ params) =>
      identityPost('/api/v1/auth/logout', params),
    'logout'
  );

  // GET with server-to-server userId header (no query param — avoids IDOR in identity-service)
  const profileBreaker = makeBreakerFor(
    async (/** @type {string} */ userId) => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { 'x-user-id': userId, 'x-internal-call': '1' },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`identity-service /me failed: ${res.status} ${text}`);
      }
      return res.json();
    },
    'profile'
  );

  return {
    login: (creds) => loginBreaker.fire(creds),
    logout: (params) => logoutBreaker.fire(params),
    getProfile: (userId) => profileBreaker.fire(userId),
  };
}

module.exports = { createIdentityClient };
