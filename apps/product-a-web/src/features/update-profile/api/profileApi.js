import { apiClient } from '@vami/api-client';

/**
 * GET /api/v1/bff/profile/me
 * @returns {Promise<{ success: boolean, profile: any }>}
 */
export async function getProfile() {
  return apiClient('/api/v1/bff/profile/me');
}

/**
 * PATCH /api/v1/bff/profile/me
 * Only sends fields the user has explicitly changed.
 *
 * @param {{ displayName?: string, bio?: string, avatarUrl?: string }} patch
 * @returns {Promise<{ success: boolean, profile: any }>}
 */
export async function updateProfile(patch) {
  return apiClient('/api/v1/bff/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}
