/**
 * Base URL for all API calls.
 * In development: Vite proxy routes /api → http://localhost:4000
 * In production: same-origin (served behind Traefik reverse proxy)
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Typed API client wrapping fetch.
 *
 * Key design decisions:
 * - `credentials: 'include'` — sends httpOnly cookies automatically on every request
 * - No Authorization header manipulation — tokens live in cookies, not localStorage
 * - All errors thrown as objects with { status, body } for consistent error handling
 *
 * @template T
 * @param {string} path - API path (e.g. '/api/v1/bff/auth/me')
 * @param {RequestInit} [options]
 * @returns {Promise<T>}
 */
async function apiClient(path, options = {}) {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',  // always send cookies — no token mgmt needed client-side
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || `HTTP ${response.status}`);
    /** @type {any} */ (error).status = response.status;
    /** @type {any} */ (error).body = body;
    throw error;
  }

  return body;
}

export { apiClient };
