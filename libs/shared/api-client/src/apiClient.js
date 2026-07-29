/**
 * Base URL for all API calls.
 * In development: Vite proxy routes /api → http://localhost:4000
 * In production: same-origin (served behind Traefik reverse proxy)
 */
const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '';

/**
 * Typed API client wrapping fetch.
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
    credentials: 'include',
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
