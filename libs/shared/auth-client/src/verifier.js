const jose = require('jose');
const { UnauthorizedError } = require('@vami/util');

/**
 * @typedef {Object} VerifiedUser
 * @property {string} userId
 * @property {string} email
 * @property {string[]} roles
 * @property {string} [jti]
 * @property {number} [exp]
 */

/**
 * @typedef {Object} VerifyOptions
 * @property {string} [issuer='vami-identity']
 * @property {string} [audience='vami-platform']
 * @property {string | URL | any} [jwksUrl]
 * @property {any} [publicKey]
 * @property {(jti: string) => Promise<boolean> | boolean} [checkRevoked]
 */

/**
 * In-memory JWKS set resolver cache.
 * Keyed by JWKS URL string to prevent redundant network calls across verify calls.
 * @type {Map<string, { resolver: any, expiresAt: number }>}
 */
const jwksCache = new Map();

/**
 * Returns a cached remote JWKS set resolver for the given URL.
 * @param {string | URL} url
 * @returns {any}
 */
function getRemoteJWKS(url) {
  const urlStr = url.toString();
  const cached = jwksCache.get(urlStr);
  const now = Date.now();
  
  if (cached && cached.expiresAt > now) {
    return cached.resolver;
  }

  const resolver = jose.createRemoteJWKSet(new URL(urlStr), {
    cacheMaxAge: 5 * 60 * 1000, // 5 minutes
    cooldownDuration: 30 * 1000, // 30 seconds
  });
  
  jwksCache.set(urlStr, { resolver, expiresAt: now + 10 * 60 * 1000 }); // 10 min TTL
  return resolver;
}

/**
 * Verifies an RS256 JWT access token statelessly.
 *
 * Checks:
 * 1. RS256 signature against public key / JWKS.
 * 2. Token expiration (`exp`) and not-before (`nbf`).
 * 3. Issuer (`iss`) and Audience (`aud`).
 * 4. Token revocation (`jti` check).
 *
 * @param {string} token
 * @param {VerifyOptions} [options]
 * @returns {Promise<VerifiedUser>}
 */
async function verifyToken(token, options = {}) {
  if (!token || typeof token !== 'string') {
    throw new UnauthorizedError('Missing or invalid authentication token.');
  }

  const {
    issuer = process.env.IDENTITY_ISSUER || 'vami-identity',
    audience = process.env.IDENTITY_AUDIENCE || 'vami-platform',
    jwksUrl = process.env.IDENTITY_JWKS_URL || 'http://localhost:5000/.well-known/jwks.json',
    publicKey,
    checkRevoked,
  } = options;

  try {
    /** @type {any} */
    let keySource;

    if (publicKey) {
      keySource = publicKey;
    } else if (typeof jwksUrl === 'function') {
      keySource = jwksUrl;
    } else {
      keySource = getRemoteJWKS(jwksUrl);
    }

    // Verify JWT with algorithm pinning (strictly RS256)
    const { payload } = await jose.jwtVerify(token, keySource, {
      algorithms: ['RS256'],
      issuer,
      audience,
      clockTolerance: 30, // 30 seconds clock skew tolerance
    });

    const userId = typeof payload.sub === 'string' ? payload.sub : '';
    const email = typeof payload.email === 'string' ? payload.email : '';
    const roles = Array.isArray(payload.roles) ? payload.roles : [];
    const jti = typeof payload.jti === 'string' ? payload.jti : undefined;
    const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId : undefined;
    const tenantId = typeof payload.tenantId === 'string' ? payload.tenantId : undefined;

    if (!userId) {
      throw new UnauthorizedError('Token payload missing subject identifier (sub).');
    }

    // Revocation check if token contains jti
    if (jti && typeof checkRevoked === 'function') {
      const isRevoked = await checkRevoked(jti);
      if (isRevoked) {
        throw new UnauthorizedError('Authentication token has been revoked.');
      }
    }

    return {
      userId,
      email,
      roles,
      jti,
      sessionId,
      tenantId,
      exp: payload.exp,
    };
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : 'Token verification failed';
    throw new UnauthorizedError(`Authentication failed: ${msg}`);
  }
}

/**
 * Clears the remote JWKS cache (useful for test resets).
 */
function clearJWKSCache() {
  jwksCache.clear();
}

module.exports = {
  verifyToken,
  clearJWKSCache,
};
