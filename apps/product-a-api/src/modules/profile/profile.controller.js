/**
 * Profile controller — HTTP boundary only.
 * @param {import('@vami/registry').ServiceRegistry} registry
 */
function createProfileController(registry) {
  /** @type {import('./profile.service').ProfileService} */
  const profileService = registry.resolve('bff.profile.service');

  return {
    /**
     * GET /api/v1/bff/profile/me
     * Returns the authenticated user's profile.
     * Profile is lazily created on first access.
     */
    async getMyProfile(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        // req.user.userId is guaranteed by authenticate() middleware — IDOR-safe
        const profile = profileService.getOrCreateProfile(
          req.user.userId,
          req.user.email?.split('@')[0]
        );
        res.status(200).json({ success: true, profile });
      } catch (err) {
        next(err);
      }
    },

    /**
     * PATCH /api/v1/bff/profile/me
     * Updates the authenticated user's profile.
     * Only fields in the service's allowlist are applied.
     */
    async updateMyProfile(/** @type {any} */ req, /** @type {any} */ res, /** @type {any} */ next) {
      try {
        const { displayName, bio, avatarUrl } = req.body || {};
        const updated = profileService.updateProfile(req.user.userId, {
          displayName,
          bio,
          avatarUrl,
        });
        res.status(200).json({ success: true, profile: updated });
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = { createProfileController };
