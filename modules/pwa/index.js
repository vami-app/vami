/**
 * modules/pwa/index.js — PWA Module Public API
 *
 * Rule: Only import from this barrel file, never from internals directly.
 * This matches the convention of all other modules (blog, products, etc.).
 *
 * NOTE: PWAProvider (client component) is NOT re-exported here.
 * Re-exporting client components through a server-side barrel causes the
 * client bundle to be pulled into server module graphs unnecessarily.
 * Import PWAProvider directly:
 *   import { PWAProvider } from '@/components/organisms/pwa/pwa-provider'
 */
export { pwaConfig } from './pwa.config.js';
