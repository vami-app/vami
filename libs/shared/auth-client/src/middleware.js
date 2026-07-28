const { verifyToken } = require('./verifier');
const { runWithContext, getContext } = require('@vami/util');

/**
 * Extracts a Bearer token from an Express Request object.
 * Checks the Authorization header (Bearer scheme) and cookies.
 * @param {any} req
 * @returns {string | null}
 */
function extractBearerToken(req) {
  if (!req) return null;

  // 1. Check Authorization header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Check HTTP-Only cookie (access_token)
  if (req.cookies && typeof req.cookies.access_token === 'string') {
    return req.cookies.access_token.trim();
  }

  return null;
}

/**
 * Express middleware for verifying JWT authentication and injecting AsyncLocalStorage context.
 *
 * @param {import('./verifier').VerifyOptions & { required?: boolean }} [options]
 * @returns {(req: any, res: any, next: any) => Promise<void>}
 */
function authenticate(options = {}) {
  const { required = true, ...verifyOpts } = options;

  return async (req, res, next) => {
    const token = extractBearerToken(req);

    if (!token) {
      if (required) {
        return next(new (require('@vami/util').UnauthorizedError)('Authentication token is required.'));
      }
      req.user = null;
      return next();
    }

    try {
      const user = await verifyToken(token, verifyOpts);
      req.user = user;

      // Merge verified user metadata into current AsyncLocalStorage request context
      const existingContext = getContext() || {};
      const updatedContext = {
        ...existingContext,
        userId: user.userId,
        email: user.email,
        roles: user.roles.join(','),
      };

      // Wrap downstream middleware execution in AsyncLocalStorage context
      runWithContext(updatedContext, () => {
        next();
      });
    } catch (err) {
      if (!required) {
        req.user = null;
        return next();
      }
      next(err);
    }
  };
}

module.exports = {
  extractBearerToken,
  authenticate,
};
