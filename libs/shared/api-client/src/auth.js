import { apiClient } from './apiClient.js';

/**
 * Fetches the current authenticated user profile.
 * @returns {Promise<{ user: { id: string, email: string, username: string, roles: string[] } }>}
 */
export async function fetchMe() {
  return await apiClient('/api/v1/bff/auth/me');
}
