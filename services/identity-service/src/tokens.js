const jose = require('jose');
const crypto = require('crypto');

/**
 * Signs an RS256 JWT access token for a user.
 *
 * Claims:
 * - sub: userId
 * - email: user email
 * - roles: user roles array
 * - iss: issuer (vami-identity)
 * - aud: audience (vami-platform)
 * - jti: unique token UUID
 * - exp: expiration (15 minutes)
 *
 * @param {Object} params
 * @param {import('./user-store').UserRecord} params.user
 * @param {import('./keys').KeyManager} params.keyManager
 * @param {string} [params.issuer='vami-identity']
 * @param {string} [params.audience='vami-platform']
 * @param {string} [params.expiresIn='15m']
 * @returns {Promise<{ accessToken: string, jti: string }>}
 */
async function signAccessToken({ user, keyManager, issuer = 'vami-identity', audience = 'vami-platform', expiresIn = '15m' }) {
  const privateKey = keyManager.getPrivateKey();
  const jti = `jti_${crypto.randomUUID()}`;

  const accessToken = await new jose.SignJWT({
    email: user.email,
    roles: user.roles,
    tenantId: user.tenantId,
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'vami-key-1' })
    .setSubject(user.id)
    .setIssuer(issuer)
    .setAudience(audience)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);

  return {
    accessToken,
    jti,
  };
}

/**
 * Signs an RS256 refresh token.
 * @param {Object} params
 * @param {import('./user-store').UserRecord} params.user
 * @param {string} params.sessionId
 * @param {import('./keys').KeyManager} params.keyManager
 * @param {string} [params.expiresIn='7d']
 * @returns {Promise<string>}
 */
async function signRefreshToken({ user, sessionId, keyManager, expiresIn = '7d' }) {
  const privateKey = keyManager.getPrivateKey();

  return new jose.SignJWT({
    sessionId,
    type: 'refresh',
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'vami-key-1' })
    .setSubject(user.id)
    .setIssuer('vami-identity')
    .setAudience('vami-platform')
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
};
