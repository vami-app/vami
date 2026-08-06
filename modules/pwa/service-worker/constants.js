/**
 * modules/pwa/service-worker/constants.js
 *
 * Cache naming and path denylist constants.
 *
 * IMPORTANT: This file uses RELATIVE imports only.
 * @serwist/cli compiles the SW with esbuild outside Next's module resolver,
 * so the @/* path alias from jsconfig.json does NOT work here.
 */

// Bump CACHE_VERSION to purge ALL caches on the next service worker activate.
// This is the nuclear option — prefer strategy-level maxAgeSeconds for normal expiry.
export const CACHE_VERSION = 'v1';

/** @param {string} name */
export const buildCacheName = (name) => `rma-${name}-${CACHE_VERSION}`;

/**
 * Runtime layer — third line of defense against caching /admin and /api.
 * (Layer 1 = globIgnores in serwist.config.js, Layer 2 = manifestTransforms)
 */
export const NETWORK_ONLY_PATHS = [
  /^\/api\//,
  /^\/admin(\/|$)/,
];

/**
 * Navigation routes that must NOT receive the /offline fallback.
 * /admin should fail with a real network error, not silently serve a cached page.
 */
export const NAVIGATION_DENYLIST = [
  /^\/admin(\/|$)/,
];
