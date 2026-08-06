/**
 * modules/pwa/service-worker/strategies.js
 *
 * Runtime caching route table, prepended before defaultCache from @serwist/next/worker.
 *
 * ORDER IS CRITICAL — more-specific rules must come first.
 * NetworkOnly for /api and /admin MUST be first so nothing below can match them.
 *
 * IMPORTANT: Relative imports only — @/* alias does not resolve in esbuild context.
 */

import { defaultCache } from '@serwist/next/worker';
import {
  NetworkOnly,
  CacheFirst,
  StaleWhileRevalidate,
  NetworkFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';
import { buildCacheName, NETWORK_ONLY_PATHS } from './constants.js';

/** @type {import('serwist').RuntimeCaching[]} */
export const runtimeCaching = [
  // ── 1. Security: never cache /api/* or /admin/* ──────────────────────────
  {
    matcher: ({ url }) =>
      NETWORK_ONLY_PATHS.some((pattern) => pattern.test(url.pathname)),
    handler: new NetworkOnly(),
  },

  // ── 2. Next.js static assets — content-hashed, immutable ─────────────────
  {
    matcher: ({ url }) => url.pathname.startsWith('/_next/static/'),
    handler: new CacheFirst({
      cacheName: buildCacheName('static'),
      plugins: [
        new ExpirationPlugin({ maxAgeSeconds: 365 * 24 * 60 * 60 }), // 1 year
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },

  // ── 3. Next.js optimised images (/_next/image?*) ─────────────────────────
  {
    matcher: ({ url }) => url.pathname.startsWith('/_next/image'),
    handler: new StaleWhileRevalidate({
      cacheName: buildCacheName('next-image'),
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 64,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },

  // ── 4. Cloudinary and Unsplash remote images ──────────────────────────────
  // cacheableResponse includes status 0 (opaque responses from cross-origin)
  {
    matcher: ({ url }) =>
      url.hostname === 'res.cloudinary.com' ||
      url.hostname === 'images.unsplash.com',
    handler: new CacheFirst({
      cacheName: buildCacheName('remote-images'),
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 120,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },

  // ── 5. Local static assets (/images/*, /icons/*) ─────────────────────────
  {
    matcher: ({ url }) =>
      url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/'),
    handler: new CacheFirst({
      cacheName: buildCacheName('local-assets'),
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          maxEntries: 60,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },

  // ── 6. HTML navigations — NetworkFirst with timeout ───────────────────────
  // Falls back to the precached /offline page (configured in sw.js fallbacks)
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: buildCacheName('pages'),
      networkTimeoutSeconds: 3,
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 24 * 60 * 60, // 1 day
          maxEntries: 32,
        }),
        new CacheableResponsePlugin({ statuses: [0, 200] }),
      ],
    }),
  },

  // ── defaultCache handles RSC payloads, prefetch requests, etc. ───────────
  ...defaultCache,
];
