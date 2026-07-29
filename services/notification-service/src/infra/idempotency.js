class IdempotencyService {
  /** @type {Map<string, number>} */
  #memoryStore = new Map();

  /**
   * Attempts to acquire an atomic idempotency lock for a notification request.
   * Prevents duplicate execution from retries or concurrent events.
   *
   * @param {string} idempotencyKey
   * @param {number} [ttlMs=300000] 5 minutes default TTL
   * @returns {Promise<boolean>} true if lock acquired (first time), false if duplicate
   */
  async acquireLock(idempotencyKey, ttlMs = 300000) {
    if (!idempotencyKey) return true;

    const now = Date.now();
    const existingExpiry = this.#memoryStore.get(idempotencyKey);

    if (existingExpiry && existingExpiry > now) {
      return false; // Lock already held — duplicate request
    }

    this.#memoryStore.set(idempotencyKey, now + ttlMs);
    return true;
  }

  /**
   * Releases an idempotency lock manually.
   * @param {string} idempotencyKey
   */
  async releaseLock(idempotencyKey) {
    this.#memoryStore.delete(idempotencyKey);
  }
}

module.exports = { IdempotencyService };
