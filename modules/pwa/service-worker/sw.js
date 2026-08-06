/**
 * modules/pwa/service-worker/sw.js — Serwist service worker entry point
 *
 * IMPORTANT: Relative imports only.
 * @serwist/cli bundles this with esbuild. The @/* path alias from jsconfig.json
 * does NOT resolve here. Never use @/ imports in this directory.
 *
 * self.__SW_MANIFEST is injected by Serwist's build step (globbed from .next/).
 */

import { Serwist } from 'serwist';
import { runtimeCaching } from './strategies.js';
import { NAVIGATION_DENYLIST } from './constants.js';

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,

  /**
   * skipWaiting: false — deliberate.
   *
   * The waiting worker sits idle until the user clicks "Reload" in
   * UpdateAvailable.jsx. This prevents a mid-session asset mismatch where
   * new JS chunks are fetched but the old HTML shell references old chunks.
   */
  skipWaiting: false,

  /**
   * clientsClaim: true — take control of all open tabs immediately on activate.
   * Works with skipWaiting:false: the new worker waits, then claims all clients
   * the moment it activates.
   */
  clientsClaim: true,

  navigationPreload: true,

  runtimeCaching,

  /**
   * Fallback to /offline for failed document navigations.
   * Matcher restricts it to non-admin navigations — /admin/ must fail with a
   * real network error, not silently serve a cached page.
   *
   * FallbacksOptions.entries: Array of { url, matcher }
   * @see node_modules/serwist/dist/index.d.mts
   */
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher: ({ request, url }) => {
          // Only use /offline fallback for document navigations
          if (request.mode !== 'navigate') return false;
          // Never use /offline for admin routes — they should fail with a network error
          return !NAVIGATION_DENYLIST.some((pattern) => pattern.test(url.pathname));
        },
      },
    ],
  },
});

serwist.addEventListeners();
