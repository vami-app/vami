const { NotFoundError } = require('@vami/util');

/**
 * Profile service — business logic layer for user profile management.
 *
 * Rules:
 * - Does NOT know about HTTP (no req/res)
 * - Does NOT set cookies or headers
 * - All errors are domain errors (NotFoundError, etc.) — never HTTP errors
 */
class ProfileService {
  /**
   * @param {{ profileRepository: import('./profile.repository').ProfileRepository }} deps
   */
  constructor({ profileRepository }) {
    this._repo = profileRepository;
  }

  /**
   * Gets or creates a profile for the given userId.
   * Profiles are lazily created on first access — no explicit "create profile" step required.
   *
   * @param {string} userId
   * @param {string} [displayName] - used only when creating a new profile
   * @returns {import('./profile.repository').ProfileRecord}
   */
  getOrCreateProfile(userId, displayName) {
    const existing = this._repo.findByUserId(userId);
    if (existing) return existing;
    return this._repo.create({ userId, displayName: displayName || '' });
  }

  /**
   * Returns the profile for a given userId.
   * @param {string} userId
   * @returns {import('./profile.repository').ProfileRecord}
   * @throws {NotFoundError} if profile does not exist
   */
  getProfile(userId) {
    const profile = this._repo.findByUserId(userId);
    if (!profile) {
      throw new NotFoundError(`Profile not found for user '${userId}'.`);
    }
    return profile;
  }

  /**
   * Updates allowed mutable profile fields.
   * Only fields explicitly in the allowlist can be changed —
   * prevents mass-assignment vulnerabilities.
   *
   * @param {string} userId
   * @param {{ displayName?: string, bio?: string, avatarUrl?: string }} patch
   * @returns {import('./profile.repository').ProfileRecord}
   * @throws {NotFoundError} if profile does not exist
   */
  updateProfile(userId, patch) {
    // Allowlist — never pass the raw req.body object to the repository
    const allowedPatch = {
      ...(patch.displayName !== undefined && { displayName: String(patch.displayName).trim().substring(0, 100) }),
      ...(patch.bio !== undefined && { bio: String(patch.bio).trim().substring(0, 500) }),
      ...(patch.avatarUrl !== undefined && { avatarUrl: String(patch.avatarUrl).trim().substring(0, 2048) }),
    };

    if (Object.keys(allowedPatch).length === 0) {
      // Nothing to update — return current state
      return this.getProfile(userId);
    }

    return this._repo.update(userId, allowedPatch);
  }
}

module.exports = { ProfileService };
