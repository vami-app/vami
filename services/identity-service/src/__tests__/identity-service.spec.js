const {
  KeyManager,
  UserStore,
  SessionStore,
  hashPassword,
  verifyPassword,
  createAuthRouter,
} = require('../index');
const jose = require('jose');
const express = require('express');
const supertest = require('supertest');

describe('@vami/identity-service', () => {
  describe('KeyManager', () => {
    it('initializes and exports valid RS256 JWKS public key set', async () => {
      const km = new KeyManager();
      await km.initialize();

      const jwks = km.getJWKS();
      expect(jwks).toBeDefined();
      expect(Array.isArray(jwks.keys)).toBe(true);
      expect(jwks.keys[0].kty).toBe('RSA');
      expect(jwks.keys[0].alg).toBe('RS256');
    });
  });

  describe('Argon2id Passwords', () => {
    it('hashes and verifies passwords correctly using Argon2id', async () => {
      const plain = 'SuperSecretPass123!';
      const hash = await hashPassword(plain);

      expect(hash).toContain('$argon2id$');
      expect(await verifyPassword(hash, plain)).toBe(true);
      expect(await verifyPassword(hash, 'WrongPassword')).toBe(false);
    });

    it('rejects passwords shorter than 8 characters', async () => {
      await expect(hashPassword('short')).rejects.toThrow(/at least 8 characters/);
    });
  });

  describe('UserStore', () => {
    /** @type {UserStore} */
    let userStore;

    beforeEach(() => {
      userStore = new UserStore();
    });

    it('creates and retrieves users by email and username', () => {
      const user = userStore.createUser({
        email: 'Alice@Vami.com',
        username: 'alice',
        passwordHash: 'hash123',
        roles: ['ADMIN'],
      });

      expect(user.id).toMatch(/^usr_/);
      expect(userStore.findByEmail('alice@vami.com')?.id).toBe(user.id);
      expect(userStore.findByUsername('alice')?.id).toBe(user.id);
      expect(userStore.findById(user.id)?.email).toBe('alice@vami.com');
    });

    it('prevents duplicate email registration', () => {
      userStore.createUser({ email: 'dup@vami.com', username: 'u1', passwordHash: 'h' });
      expect(() =>
        userStore.createUser({ email: 'DUP@vami.com', username: 'u2', passwordHash: 'h' })
      ).toThrow(/already exists/);
    });
  });

  describe('SessionStore', () => {
    /** @type {SessionStore} */
    let sessionStore;

    beforeEach(() => {
      sessionStore = new SessionStore();
    });

    it('creates, retrieves, and revokes sessions', async () => {
      const session = await sessionStore.createSession('sess_1', { userId: 'usr_1' });
      expect(session.sessionId).toBe('sess_1');

      const retrieved = await sessionStore.getSession('sess_1');
      expect(retrieved.userId).toBe('usr_1');

      await sessionStore.revokeSession('sess_1', 'jti_abc');
      expect(await sessionStore.getSession('sess_1')).toBeNull();
      expect(await sessionStore.isRevoked('jti_abc')).toBe(true);
    });
  });

  describe('End-to-End Auth Router Endpoints', () => {
    /** @type {any} */
    let app;
    /** @type {KeyManager} */
    let keyManager;
    /** @type {UserStore} */
    let userStore;
    /** @type {SessionStore} */
    let sessionStore;

    beforeAll(async () => {
      keyManager = new KeyManager();
      await keyManager.initialize();
      userStore = new UserStore();
      sessionStore = new SessionStore();

      app = express();
      const router = createAuthRouter({ keyManager, userStore, sessionStore });
      app.use(router);

      // Simple error handler for test assertions
      app.use((/** @type {any} */ err, /** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ _next) => {
        res.status(err.statusCode || 500).json({ error: err.message });
      });
    });

    it('POST /api/v1/auth/register creates a new user', async () => {
      const res = await supertest(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'bob@vami.com',
          username: 'bob',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('bob@vami.com');
    });

    it('POST /api/v1/auth/login authenticates user and returns valid access token', async () => {
      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bob@vami.com',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      
      const cookiesHeader = loginRes.headers['set-cookie'];
      expect(cookiesHeader).toBeDefined();
      const cookies = Array.isArray(cookiesHeader) ? cookiesHeader : [cookiesHeader];
      const accessTokenCookie = cookies.find((/** @type {string} */ c) => c && c.startsWith('access_token='));
      expect(accessTokenCookie).toBeDefined();

      const accessToken = accessTokenCookie.split(';')[0].split('=')[1];

      // Statelessly verify access token against keyManager JWKS
      const jwks = keyManager.getJWKS();
      const JWKS = jose.createLocalJWKSet(jwks);

      const { payload } = await jose.jwtVerify(accessToken, JWKS, {
        issuer: 'vami-identity',
        audience: 'vami-platform',
      });

      expect(payload.email).toBe('bob@vami.com');
      expect(payload.sub).toBe(loginRes.body.user.id);
    });

    it('GET /.well-known/jwks.json serves public keys', async () => {
      const res = await supertest(app).get('/.well-known/jwks.json');
      expect(res.status).toBe(200);
      expect(res.body.keys).toBeDefined();
      expect(res.body.keys[0].kty).toBe('RSA');
    });

    it('Internal S2S endpoints enforce x-internal-secret authentication', async () => {
      const unauth = await supertest(app).get('/internal/v1/users/usr_123');
      expect(unauth.status).toBe(401);

      const auth = await supertest(app)
        .get('/internal/v1/users/usr_nonexistent')
        .set('x-internal-secret', 'dev-internal-secret');
      expect(auth.status).toBe(401); // User not found, not Secret missing
    });

    it('POST /internal/v1/auth/login and GET /internal/v1/users/:id work S2S', async () => {
      const loginRes = await supertest(app)
        .post('/internal/v1/auth/login')
        .set('x-internal-secret', 'dev-internal-secret')
        .send({
          email: 'bob@vami.com',
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.refreshToken).toBeDefined();

      const userRes = await supertest(app)
        .get(`/internal/v1/users/${loginRes.body.user.id}`)
        .set('x-internal-secret', 'dev-internal-secret');

      expect(userRes.status).toBe(200);
      expect(userRes.body.user.email).toBe('bob@vami.com');
    });

    it('POST /api/v1/auth/refresh performs refresh token rotation', async () => {
      const loginRes = await supertest(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'bob@vami.com',
          password: 'Password123!',
        });

      const refreshToken = loginRes.body.refreshToken;
      expect(refreshToken).toBeDefined();

      const refreshRes = await supertest(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken });

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.accessToken).toBeDefined();
      expect(refreshRes.body.refreshToken).toBeDefined();
      expect(refreshRes.body.refreshToken).not.toBe(refreshToken); // rotated!
    });
  });
});
