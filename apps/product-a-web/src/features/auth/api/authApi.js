import { apiClient } from '../../../shared/api/apiClient';

/**
 * POST /api/v1/bff/auth/login
 * Server responds with access_token + refresh_token in httpOnly cookies.
 * Response body contains only user info — no tokens.
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ success: boolean, user: any }>}
 */
export async function login({ email, password }) {
  return apiClient('/api/v1/bff/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/**
 * POST /api/v1/bff/auth/logout
 * Clears httpOnly cookies server-side and revokes the session.
 *
 * @returns {Promise<{ success: boolean }>}
 */
export async function logout() {
  return apiClient('/api/v1/bff/auth/logout', { method: 'POST' });
}
