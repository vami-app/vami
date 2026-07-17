/**
 * API base URL for the Express backend.
 * @type {string}
 */
export const API_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    : "";

/**
 * Resolve a possibly-relative upload path to an absolute URL on the API host.
 * @param {string} path
 * @returns {string}
 */
export function resolveMedia(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  
  // If absolute API_URL is needed on server or if running in browser
  const base = typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000")
    : "";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Error thrown for non-2xx API responses, carrying the parsed envelope.
 */
export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Array<{field?: string, message: string}>} [errors]
   */
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

/** @type {Promise<any>|null} Shared in-flight refresh to avoid stampedes. */
let refreshPromise = null;

/**
 * Attempt a single silent token refresh.
 * @returns {Promise<boolean>} true if refresh succeeded
 */
async function tryRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.ok)
      .catch(() => false)
      .finally(() => {
        // Clear after a tick so concurrent callers share this result
        setTimeout(() => {
          refreshPromise = null;
        }, 0);
      });
  }
  return refreshPromise;
}

/**
 * Core fetch wrapper. Sends cookies, parses the standard envelope, and
 * transparently retries once after a 401 by refreshing the access token.
 * @param {string} path - path beginning with /api/...
 * @param {RequestInit & { _retried?: boolean }} [options]
 * @returns {Promise<any>} the `data` field of the success envelope
 */
export async function apiFetch(path, options = {}) {
  const { _retried, headers, body, ...rest } = options;

  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...headers,
    },
    body,
    ...rest,
  });

  if (res.status === 401 && !_retried && path !== "/api/auth/refresh") {
    const ok = await tryRefresh();
    if (ok) {
      return apiFetch(path, { ...options, _retried: true });
    }
  }

  let json = null;
  try {
    json = await res.json();
  } catch (e) {
    json = null;
  }

  if (!res.ok || (json && json.success === false)) {
    const message = (json && json.message) || `Request failed (${res.status})`;
    throw new ApiError(res.status, message, (json && json.errors) || []);
  }

  return json ? json.data : null;
}

/** Convenience helpers */
export const api = {
  /** @param {string} p */
  get: (p) => apiFetch(p),
  /** @param {string} p @param {any} data */
  post: (p, data) => apiFetch(p, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  /** @param {string} p @param {any} data */
  patch: (p, data) => apiFetch(p, { method: "PATCH", body: JSON.stringify(data) }),
  /** @param {string} p */
  del: (p) => apiFetch(p, { method: "DELETE" }),
  /** @param {string} p @param {FormData} form */
  upload: (p, form) => apiFetch(p, { method: "POST", body: form }),
};
