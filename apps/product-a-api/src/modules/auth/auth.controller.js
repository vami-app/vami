const { BadRequestError } = require('@vami/util');

/**
 * Auth controller — HTTP boundary layer only.
 *
 * Responsibilities (ONLY):
 * 1. Validate and extract request data
 * 2. Call the service
 * 3. Set cookies / write response
 * 4. Pass errors to next(err)
 *
 * Zero business logic lives here.
 *
 * @param {import('@vami/registry').ServiceRegistry} registry
 */
function createAuthController(registry) {
  /** @type {import('./auth.service').AuthService} */
  const authService = registry.resolve('bff.auth.service');

  return {
    /**
     * POST /api/v1/bff/auth/login
     * Authenticates the user. Sets access_token and refresh_token as httpOnly cookies.
     * Body response contains only user info — never tokens.
     */
    async login(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        const { email, password } = req.body || {};
        if (!email || typeof email !== 'string') throw new BadRequestError('email is required');
        if (!password || typeof password !== 'string') throw new BadRequestError('password is required');

        const result = await authService.login({ email, password });

        // Set tokens as httpOnly cookies — not in response body
        if (result.accessToken) {
          res.cookie('access_token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000, // 15 min
          });
        }

        if (result.refreshToken) {
          res.cookie('refresh_token', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/v1/bff/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          });
        }

        // User info only — zero token fields in body
        res.status(200).json({ success: true, user: result.user });
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/v1/bff/auth/register
     */
    async register(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        const { email, username, password } = req.body || {};
        if (!email || typeof email !== 'string') throw new BadRequestError('email is required');
        if (!username || typeof username !== 'string') throw new BadRequestError('username is required');
        if (!password || typeof password !== 'string') throw new BadRequestError('password is required');

        const result = await authService.register({ email, username, password });
        res.status(201).json(result);
      } catch (err) {
        next(err);
      }
    },

    /**
     * POST /api/v1/bff/auth/logout
     * Requires authentication. Extracts jti + sessionId from verified token payload (req.user).
     * NEVER reads these from req.body (IDOR prevention).
     */
    async logout(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        const { jti, sessionId } = req.user || {};
        if (jti || sessionId) {
          await authService.logout({ jti, sessionId });
        }

        res.clearCookie('access_token');
        res.clearCookie('refresh_token', { path: '/api/v1/bff/auth/refresh' });
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
      } catch (err) {
        next(err);
      }
    },

    /**
     * GET /api/v1/bff/auth/me
     * Returns the authenticated user's profile.
     * userId comes exclusively from req.user.userId (set by authenticate middleware).
     * NEVER from req.query — IDOR prevention.
     */
    async me(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        const user = await authService.getProfile(req.user.userId);
        res.status(200).json({ success: true, user });
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createAuthController };
