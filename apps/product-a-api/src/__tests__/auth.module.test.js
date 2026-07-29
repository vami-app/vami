// describe, it, expect, vi, beforeEach injected globally via vitest globals:true
const supertest = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

const { AuthService } = require('../modules/auth/auth.service');
const { createAuthController } = require('../modules/auth/auth.controller');
const { errorHandler } = require('../infra/error-handler');

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a minimal Express app wired with the auth controller.
 * No JWKS or identity-service required — identityClient is mocked.
 * @param {{ identityClient: any }} overrides
 */
function buildTestApp({ identityClient }) {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Create a mock ServiceRegistry that resolves bff.auth.service
  const mockRegistry = {
    resolve: vi.fn((name) => {
      if (name === 'bff.auth.service') {
        return new AuthService({ identityClient });
      }
      throw new Error(`Unknown service: ${name}`);
    }),
  };

  const controller = createAuthController(/** @type {any} */ (mockRegistry));

  // Mount routes directly without the full module wiring
  app.post('/api/v1/bff/auth/login', controller.login);

  // Authenticated routes: inject req.user manually to skip JWKS
  app.post('/api/v1/bff/auth/logout', (req, _res, next) => {
    /** @type {any} */ (req).user = { userId: 'usr_001', jti: 'jti_abc', sessionId: 'sess_001' };
    next();
  }, controller.logout);

  app.get('/api/v1/bff/auth/me', (req, _res, next) => {
    /** @type {any} */ (req).user = { userId: 'usr_001' };
    next();
  }, controller.me);

  app.use(errorHandler);
  return supertest(app);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Auth Module — AuthService + Controller (unit, no identity-service)', () => {
  const mockUser = { id: 'usr_001', email: 'alice@vami.com', username: 'alice', roles: ['MEMBER'] };

  describe('POST /api/v1/bff/auth/login', () => {
    it('sets access_token and refresh_token as httpOnly cookies on success', async () => {
      const identityClient = {
        login: vi.fn().mockResolvedValue({
          user: mockUser,
          accessToken: 'mock.access.token',
          refreshToken: 'mock.refresh.token',
        }),
        logout: vi.fn(),
        getProfile: vi.fn(),
      };

      const request = buildTestApp({ identityClient });
      const res = await request.post('/api/v1/bff/auth/login')
        .send({ email: 'alice@vami.com', password: 'Password123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('alice@vami.com');

      // Tokens must NOT be in the response body
      expect(res.body.accessToken).toBeUndefined();
      expect(res.body.refreshToken).toBeUndefined();

      // Tokens must be set as httpOnly cookies
      const cookies = res.headers['set-cookie'] || [];
      const cookieArr = Array.isArray(cookies) ? cookies : [cookies];
      expect(cookieArr.some((/** @type {string} */ c) => c.startsWith('access_token='))).toBe(true);
      expect(cookieArr.some((/** @type {string} */ c) => c.includes('HttpOnly'))).toBe(true);
    });

    it('returns 400 when email is missing', async () => {
      const identityClient = { login: vi.fn(), logout: vi.fn(), getProfile: vi.fn() };
      const request = buildTestApp({ identityClient });

      const res = await request.post('/api/v1/bff/auth/login').send({ password: 'pass' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('BAD_REQUEST');
    });

    it('propagates ServiceUnavailableError (503) when circuit breaker fires', async () => {
      const { ServiceUnavailableError } = require('@vami/util');
      const identityClient = {
        login: vi.fn().mockRejectedValue(new ServiceUnavailableError('Identity service unavailable')),
        logout: vi.fn(),
        getProfile: vi.fn(),
      };

      const request = buildTestApp({ identityClient });
      const res = await request.post('/api/v1/bff/auth/login')
        .send({ email: 'a@b.com', password: 'pass1234' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('SERVICE_UNAVAILABLE');
    });
  });

  describe('POST /api/v1/bff/auth/logout', () => {
    it('clears cookies and revokes session', async () => {
      const identityClient = {
        login: vi.fn(),
        logout: vi.fn().mockResolvedValue({ success: true }),
        getProfile: vi.fn(),
      };

      const request = buildTestApp({ identityClient });
      const res = await request.post('/api/v1/bff/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(identityClient.logout).toHaveBeenCalledWith({ jti: 'jti_abc', sessionId: 'sess_001' });
    });
  });

  describe('GET /api/v1/bff/auth/me', () => {
    it('returns user profile from identity-service', async () => {
      const identityClient = {
        login: vi.fn(),
        logout: vi.fn(),
        getProfile: vi.fn().mockResolvedValue({ user: mockUser }),
      };

      const request = buildTestApp({ identityClient });
      const res = await request.get('/api/v1/bff/auth/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(identityClient.getProfile).toHaveBeenCalledWith('usr_001');
    });
  });
});
