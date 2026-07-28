const express = require('express');
const { hashPassword, verifyPassword } = require('./passwords');
const { signAccessToken, signRefreshToken } = require('./tokens');
const { BadRequestError, UnauthorizedError, ConflictError } = require('@vami/util');
const crypto = require('crypto');

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
  router.post('/api/v1/auth/register', async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
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
  router.post('/api/v1/auth/login', async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
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
      const { accessToken } = await signAccessToken({ user, keyManager });
      const refreshToken = await signRefreshToken({ user, sessionId, keyManager });

      // Attach HTTP-Only refresh cookie
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
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
   * POST /api/v1/auth/logout
   * Logout Everywhere: revokes global session and places jti in revocation list.
   */
  router.post('/api/v1/auth/logout', async (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const { sessionId, jti } = req.body || {};
      if (sessionId) {
        await sessionStore.revokeSession(sessionId, jti);
      }

      res.clearCookie('access_token');
      res.json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/auth/me
   */
  router.get('/api/v1/auth/me', (/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) => {
    try {
      const userId = req.query.userId || req.user?.userId;
      if (!userId || typeof userId !== 'string') {
        throw new BadRequestError('userId parameter required.');
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

  return router;
}

module.exports = {
  createAuthRouter,
};
