const express = require('express');
const { hashPassword, verifyPassword } = require('./passwords');
const { signAccessToken, signRefreshToken } = require('./tokens');
const { BadRequestError, UnauthorizedError, ConflictError } = require('@vami/util');
const crypto = require('crypto');
const jose = require('jose');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');
/**
 * Creates the Express authentication router for identity-service.
 *
 * @param {Object} deps
 * @param {import('./user-store').UserStore} deps.userStore
 * @param {import('./sessions').SessionStore} deps.sessionStore
 * @param {import('./keys').KeyManager} deps.keyManager
 * @returns {import('express').Router}
 */
function createAuthRouter({ userStore, sessionStore, keyManager }) {
  const router = express.Router();

  // Parse JSON bodies if Express body-parser is not attached globally
  router.use(express.json());
  router.use(cookieParser());

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => next(new UnauthorizedError('Too many login attempts, please try again after 15 minutes.'))
  });

  const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => next(new UnauthorizedError('Too many registration attempts, please try again after 15 minutes.'))
  });

  const authenticate = async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const token = req.cookies?.access_token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
      if (!token) throw new UnauthorizedError('Authentication required');
      const publicKey = keyManager.getPublicKey();
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: 'vami-identity',
        audience: 'vami-platform'
      });
      req.user = payload;
      next();
    } catch (err) {
      next(new UnauthorizedError('Invalid or expired token'));
    }
  };

  /**
   * GET /.well-known/jwks.json
   * Public JWKS endpoint exposing RSA public keys for stateless verification across BFFs.
   */
  router.get('/.well-known/jwks.json', (/** @type {any} */ _req, /** @type {any} */ res) => {
    res.json(keyManager.getJWKS());
  });

  /**
   * POST /api/v1/auth/register
   */
  router.post('/api/v1/auth/register', registerLimiter, async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { email, username, password, roles } = req.body || {};

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        throw new BadRequestError('Valid email is required.');
      }
      if (!username || typeof username !== 'string' || username.trim().length < 3) {
        throw new BadRequestError('Username must be at least 3 characters.');
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters long.');
      }

      const passwordHash = await hashPassword(password);

      let user;
      try {
        user = userStore.createUser({
          email,
          username,
          passwordHash,
          roles: Array.isArray(roles) ? roles : ['MEMBER'],
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'User already exists';
        throw new ConflictError(msg);
      }

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/auth/login
   */
  router.post('/api/v1/auth/login', loginLimiter, async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { email, password } = req.body || {};

      if (!email || !password) {
        throw new BadRequestError('Email and password are required.');
      }

      const user = userStore.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      const isValid = await verifyPassword(user.passwordHash, password);
      if (!isValid) {
        throw new UnauthorizedError('Invalid email or password.');
      }

      // Create global session in SessionStore (Redis)
      const sessionId = `sess_${crypto.randomUUID()}`;
      await sessionStore.createSession(sessionId, {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      // Sign tokens
      const { accessToken } = await signAccessToken({ user, sessionId, keyManager });
      const refreshToken = await signRefreshToken({ user, sessionId, keyManager });

      // Attach HTTP-Only refresh cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/auth/refresh
   * Refresh Token Rotation: exchanges valid refresh token for new access & refresh tokens.
   */
  router.post('/api/v1/auth/refresh', async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const oldRefreshToken = req.cookies?.refresh_token || req.body?.refreshToken;
      if (!oldRefreshToken) throw new UnauthorizedError('Refresh token required.');

      const { verifyRefreshToken } = require('./tokens');
      const payload = await verifyRefreshToken(oldRefreshToken, keyManager);

      const isValidSession = await sessionStore.getSession(payload.sessionId);
      if (!isValidSession) {
        throw new UnauthorizedError('Session revoked or expired.');
      }

      const user = userStore.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedError('User not found.');
      }

      // Rotate session & tokens
      await sessionStore.revokeSession(payload.sessionId);
      const newSessionId = `sess_${crypto.randomUUID()}`;
      await sessionStore.createSession(newSessionId, {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      const { accessToken } = await signAccessToken({ user, sessionId: newSessionId, keyManager });
      const newRefreshToken = await signRefreshToken({ user, sessionId: newSessionId, keyManager });

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/api/v1/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        accessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/auth/logout
   * Logout Everywhere: revokes global session and places jti in revocation list.
   */
  router.post('/api/v1/auth/logout', authenticate, async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { sessionId, jti } = req.user || {};
      if (sessionId) {
        await sessionStore.revokeSession(sessionId, jti);
      }

      res.clearCookie('access_token');
      res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/auth/me
   */
  router.get('/api/v1/auth/me', authenticate, (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      // @ts-ignore - req.user is set by authenticate middleware
      const userId = req.user?.sub;
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('User context required.');
      }

      const user = userStore.findById(userId);
      if (!user) {
        throw new UnauthorizedError('User not found.');
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // Internal S2S Endpoints (Protected by INTERNAL_SERVICE_SECRET)
  // ─────────────────────────────────────────────────────────────
  const authenticateInternal = (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    const secret = req.headers['x-internal-secret'];
    const expectedSecret = process.env.INTERNAL_SERVICE_SECRET || 'dev-internal-secret';
    if (!secret || secret !== expectedSecret) {
      return next(new UnauthorizedError('Invalid internal service secret.'));
    }
    next();
  };

  /**
   * POST /internal/v1/auth/login
   * Internal S2S endpoint for BFF token exchange.
   */
  router.post('/internal/v1/auth/login', authenticateInternal, async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) throw new BadRequestError('Email and password are required.');

      const user = userStore.findByEmail(email);
      if (!user) throw new UnauthorizedError('Invalid email or password.');

      const isValid = await verifyPassword(user.passwordHash, password);
      if (!isValid) throw new UnauthorizedError('Invalid email or password.');

      const sessionId = `sess_${crypto.randomUUID()}`;
      await sessionStore.createSession(sessionId, {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        ip: req.ip,
        userAgent: req.headers['user-agent'] || '',
      });

      const { accessToken } = await signAccessToken({ user, sessionId, keyManager });
      const refreshToken = await signRefreshToken({ user, sessionId, keyManager });

      res.json({
        success: true,
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /internal/v1/auth/logout
   * Internal S2S endpoint to revoke sessions.
   */
  router.post('/internal/v1/auth/logout', authenticateInternal, async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { sessionId, jti } = req.body || {};
      if (sessionId) {
        await sessionStore.revokeSession(sessionId, jti);
      }
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /internal/v1/users/:userId
   * Internal S2S endpoint for fetching user profile by ID without user token.
   */
  router.get('/internal/v1/users/:userId', authenticateInternal, (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { userId } = req.params;
      const user = userStore.findById(userId);
      if (!user) throw new UnauthorizedError('User not found.');

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          roles: user.roles,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = {
  createAuthRouter,
};
