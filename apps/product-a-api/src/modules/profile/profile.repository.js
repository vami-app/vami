const crypto = require('crypto');

/**
 * @typedef {Object} ProfileRecord
 * @property {string} userId - FK to identity-service user
 * @property {string} displayName
 * @property {string} [bio]
 * @property {string} [avatarUrl]
 * @property {string} createdAt - ISO 8601
 * @property {string} updatedAt - ISO 8601
 */

/**
 * In-memory profile repository stub.
 *
 * Architecture Note:
 * ─────────────────
 * This stub implements the Repository pattern without a real database.
 * In Phase 4 this will be replaced with a Postgres adapter that:
 *   1. Accepts the same public interface (findByUserId, create, update)
 *   2. Translates `buildKeysetQuery` descriptors from @vami/pagination
 *      into Postgres parameterized WHERE clauses
 *   3. Is registered as a singleton in ServiceRegistry under 'bff.profile.repository'
 *
 * The stub exists here so the profile module is functional end-to-end
 * in Phase 3 without requiring a database connection.
 * Implements the Repository contract for UserProfile.
 */
class ProfileRepository {
  /** @type {Map<string, ProfileRecord>} */
  #store = new Map();

  /**
   * Finds a profile by userId (the FK from identity-service).
   * @param {string} userId
   * @returns {ProfileRecord | null}
   */
  findByUserId(userId) {
    return this.#store.get(userId) ?? null;
  }

  /**
   * Creates a new profile for a user.
   * Idempotent — returns the existing profile if one already exists.
   * @param {{ userId: string, displayName: string, bio?: string, avatarUrl?: string }} data
   * @returns {ProfileRecord}
   */
  create({ userId, displayName, bio, avatarUrl }) {
    const existing = this.findByUserId(userId);
    if (existing) return existing;

    const now = new Date().toISOString();
    /** @type {ProfileRecord} */
    const profile = {
      userId,
      displayName: displayName || `User ${userId.substring(0, 8)}`,
      bio: bio || '',
      avatarUrl: avatarUrl || '',
      createdAt: now,
      updatedAt: now,
    };
    this.#store.set(userId, profile);
    return profile;
  }

  /**
   * Updates an existing profile's mutable fields.
   * @param {string} userId
   * @param {{ displayName?: string, bio?: string, avatarUrl?: string }} patch
   * @returns {ProfileRecord}
   * @throws {Error} if profile does not exist
   */
  update(userId, patch) {
    const existing = this.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    const updated = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(patch).filter(([, v]) => v !== undefined)
      ),
      updatedAt: new Date().toISOString(),
    };
    this.#store.set(userId, updated);
    return updated;
  }

  /**
   * Lists all profiles (admin use only — paginated in Phase 4).
   * @returns {ProfileRecord[]}
   */
  list() {
    return Array.from(this.#store.values());
  }
}

module.exports = { ProfileRepository };
