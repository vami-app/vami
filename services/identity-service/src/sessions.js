/**
 * SessionStore manages global user sessions and token revocation.
 * Supports Redis backing or in-memory fallback for test environments.
 */
class SessionStore {
  /** @type {Map<string, any>} */
  #inMemorySessions = new Map();
  /** @type {Set<string>} */
  #inMemoryRevokedJtis = new Set();
  /** @type {any} */
  #redisClient = null;

  /**
   * @param {any} [redisClient]
   */
  constructor(redisClient = null) {
    this.#redisClient = redisClient;
  }

  /**
   * Creates a new global user session.
   * @param {string} sessionId
   * @param {Object} userData
   * @param {number} [ttlSeconds=604800] - 7 days
   */
  async createSession(sessionId, userData, ttlSeconds = 604800) {
    const sessionData = {
      ...userData,
      sessionId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    };

    if (this.#redisClient) {
      await this.#redisClient.set(
        `identity:session:${sessionId}`,
        JSON.stringify(sessionData),
        'EX',
        ttlSeconds
      );
    } else {
      this.#inMemorySessions.set(sessionId, sessionData);
    }

    return sessionData;
  }

  /**
   * Retrieves an active global user session by ID.
   * @param {string} sessionId
   * @returns {Promise<any | null>}
   */
  async getSession(sessionId) {
    if (this.#redisClient) {
      const data = await this.#redisClient.get(`identity:session:${sessionId}`);
      return data ? JSON.parse(data) : null;
    }
    return this.#inMemorySessions.get(sessionId) || null;
  }

  /**
   * Revokes a session and adds the associated token JTI to the revocation list.
   * "Logout Everywhere" mechanism.
   * @param {string} sessionId
   * @param {string} [jti]
   * @param {number} [jtiTtlSeconds=900] - 15 minutes matching access token lifetime
   */
  async revokeSession(sessionId, jti, jtiTtlSeconds = 900) {
    if (this.#redisClient) {
      await this.#redisClient.del(`identity:session:${sessionId}`);
      if (jti) {
        await this.#redisClient.set(`identity:revoked:${jti}`, '1', 'EX', jtiTtlSeconds);
      }
    } else {
      this.#inMemorySessions.delete(sessionId);
      if (jti) {
        this.#inMemoryRevokedJtis.add(jti);
      }
    }
  }

  /**
   * Checks if a token JTI has been revoked.
   * @param {string} jti
   * @returns {Promise<boolean>}
   */
  async isRevoked(jti) {
    if (!jti) return false;

    if (this.#redisClient) {
      const exists = await this.#redisClient.exists(`identity:revoked:${jti}`);
      return exists === 1;
    }
    return this.#inMemoryRevokedJtis.has(jti);
  }

  /**
   * Clears state (useful for test resets).
   */
  reset() {
    this.#inMemorySessions.clear();
    this.#inMemoryRevokedJtis.clear();
  }
}

module.exports = {
  SessionStore,
};
