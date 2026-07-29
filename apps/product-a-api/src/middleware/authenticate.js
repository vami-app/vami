const { authenticate: authClientAuthenticate } = require('@vami/auth-client');

/**
 * BFF authentication middleware.
 *
 * Thin wrapper around `@vami/auth-client`'s `authenticate` factory so the BFF
 * doesn't need to know about the underlying token verification strategy.
 *
 * On success: sets `req.user = { userId, email, roles, jti, exp, sessionId }`.
 * On failure (if required): passes an UnauthorizedError to next().
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
  });
}

module.exports = { authenticate };
