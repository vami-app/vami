const jose = require('jose');
const { verifyToken, extractBearerToken, authenticate } = require('../index');
const { runWithContext, getContext } = require('@vami/util');

describe('@vami/auth-client', () => {
  /** @type {any} */
  let keyPair;
  /** @type {any} */
  let privateKey;
  /** @type {any} */
  let publicKey;

  beforeAll(async () => {
    keyPair = await jose.generateKeyPair('RS256');
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  });

  /**
   * Helper to sign test tokens using the test private key.
   * @param {Record<string, any>} payload
   * @param {Record<string, any>} options
   */
  async function signTestToken(payload = {}, options = {}) {
    const {
      sub = 'usr_test_123',
      email = 'test@vami.com',
      roles = ['MEMBER'],
      issuer = 'vami-identity',
      audience = 'vami-platform',
      expirationTime = '15m',
      jti = 'jti_test_abc',
    } = options;

    const builder = new jose.SignJWT({
      sub,
      email,
      roles,
      ...payload,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setJti(jti)
      .setIssuedAt();

    if (expirationTime) {
      builder.setExpirationTime(expirationTime);
    }

    return builder.sign(privateKey);
  }

  describe('verifyToken', () => {
    it('verifies a valid RS256 token against a public key', async () => {
      const token = await signTestToken({}, { sub: 'usr_1', email: 'a@vami.com', roles: ['ADMIN'] });
      const verified = await verifyToken(token, { publicKey });

      expect(verified.userId).toBe('usr_1');
      expect(verified.email).toBe('a@vami.com');
      expect(verified.roles).toEqual(['ADMIN']);
      expect(verified.jti).toBe('jti_test_abc');
    });

    it('rejects expired tokens', async () => {
      const pastTime = Math.floor(Date.now() / 1000) - 60; // 60 seconds in the past
      const token = await signTestToken({}, { expirationTime: pastTime });
      await expect(verifyToken(token, { publicKey })).rejects.toThrow(/Authentication failed/);
    });

    it('rejects token with unexpected issuer', async () => {
      const token = await signTestToken({}, { issuer: 'untrusted-issuer' });
      await expect(verifyToken(token, { publicKey })).rejects.toThrow(/unexpected "iss" claim/);
    });

    it('rejects token with unexpected audience', async () => {
      const token = await signTestToken({}, { audience: 'untrusted-audience' });
      await expect(verifyToken(token, { publicKey })).rejects.toThrow(/unexpected "aud" claim/);
    });

    it('honors revocation check callback', async () => {
      const token = await signTestToken({}, { jti: 'revoked_jti_1' });
      const checkRevoked = (/** @type {string} */ jti) => jti === 'revoked_jti_1';

      await expect(verifyToken(token, { publicKey, checkRevoked })).rejects.toThrow(/revoked/);
    });
  });

  describe('extractBearerToken', () => {
    it('extracts token from Authorization header', () => {
      const req = { headers: { authorization: 'Bearer secret_token_xyz' } };
      expect(extractBearerToken(req)).toBe('secret_token_xyz');
    });

    it('extracts token from cookies', () => {
      const req = { cookies: { access_token: 'cookie_token_123' } };
      expect(extractBearerToken(req)).toBe('cookie_token_123');
    });

    it('returns null when no token is present', () => {
      expect(extractBearerToken({})).toBeNull();
    });
  });

  describe('authenticate middleware', () => {
    it('attaches verified user to req.user and populates AsyncLocalStorage context', async () => {
      const token = await signTestToken({}, { sub: 'usr_ctx_99', email: 'ctx@vami.com', roles: ['MEMBER'] });
      /** @type {{ headers: Record<string, string>, user?: any }} */
      const req = { headers: { authorization: `Bearer ${token}` }, user: null };
      const res = {};

      const mw = authenticate({ publicKey });

      await new Promise((resolve, reject) => {
        mw(req, res, (/** @type {any} */ err) => {
          if (err) return reject(err);
          try {
            expect(req.user).toBeDefined();
            expect(req.user?.userId).toBe('usr_ctx_99');

            // Verify AsyncLocalStorage context binding
            const ctx = getContext();
            expect(ctx).toBeDefined();
            expect(ctx?.userId).toBe('usr_ctx_99');
            expect(ctx?.email).toBe('ctx@vami.com');
            resolve(true);
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('passes UnauthorizedError when token is missing and required=true', async () => {
      const req = { headers: {} };
      const res = {};
      const mw = authenticate({ publicKey, required: true });

      await new Promise((resolve) => {
        mw(req, res, (/** @type {any} */ err) => {
          expect(err).toBeDefined();
          expect(err.statusCode).toBe(401);
          resolve(true);
        });
      });
    });
  });
});
