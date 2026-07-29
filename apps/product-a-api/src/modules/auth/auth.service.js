/**
 * @typedef {{ email: string, password: string }} LoginCredentials
 * @typedef {{ jti?: string, sessionId?: string }} LogoutParams
 */

/**
 * Auth service — orchestrates identity-service calls through the circuit breaker.
 *
 * Business rules:
 * - login/logout/getProfile are all delegated to the identity-client
 * - The service does NOT touch cookies — that is the controller's responsibility
 * - Errors from the identity-client (including 503 ServiceUnavailableError)
 *   bubble up through next(err) via the controller's try/catch
 */
class AuthService {
  /**
   * @param {{ identityClient: ReturnType<import('../../resilience/identity-client').createIdentityClient> }} deps
   */
  constructor({ identityClient }) {
    this._identityClient = identityClient;
  }

  /**
   * Authenticates a user against the identity service.
   * Returns the user payload and tokens from identity-service.
   *
   * @param {LoginCredentials} credentials
   * @returns {Promise<{ user: any, accessToken: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    const data = await this._identityClient.login({ email, password });
    return {
      user: data.user,
      // identity-service now returns tokens via cookies, not body
      // This path handles server-to-server flows where tokens may be in body
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  }

  /**
   * Revokes the user session via the identity service.
   * @param {LogoutParams} params
   * @returns {Promise<void>}
   */
  async logout({ jti, sessionId }) {
    await this._identityClient.logout({ jti, sessionId });
  }

  /**
   * Fetches the user profile from the identity service by userId.
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async getProfile(userId) {
    const data = await this._identityClient.getProfile(userId);
    return data.user;
  }
}

module.exports = { AuthService };
