/**
 * serwist.config.js — Serwist configurator mode build config
 *
 * Run automatically by: npm run build (next build && serwist build)
 * Reads .next/ prerender output to auto-precache public routes.
 *
 * @see https://serwist.pages.dev/docs/next/config
 */

import { spawnSync } from "node:child_process";
import { serwist } from "@serwist/next/config";

// Use the current git commit hash as the revision for additionalPrecacheEntries.
// This ensures /offline is re-cached whenever the codebase changes.
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() || crypto.randomUUID();

/**
 * Admin/API exclusion — THREE independent layers (defense in depth).
 *
 * WHY THREE LAYERS:
 * Serwist's internal URL rewriter runs AFTER user manifestTransforms, so at
 * the time our transform fires, an admin entry still looks like:
 *   ".next/server/app/admin/login.html"   ← not yet rewritten to "/admin/login"
 *   ".next/server/app/admin.html"   ← not yet rewritten to "/admin"
 *
 * A naive filter on "/admin" matches nothing → silent no-op → authenticated
 * HTML gets precached and survives logout.
 *
 * Layer 1 (globIgnores):    dist-relative, applied at glob time before transforms
 * Layer 2 (manifestTransforms): regex matches BOTH the raw dist form and rewritten form
 * Layer 3 (NetworkOnly in sw.js): runtime guarantee regardless of precache state
 */

// Matches both raw dist form (.next/server/app/admin.html or .next/server/app/admin/*)
// and the rewritten URL form (/admin or /admin/*).
// The regex must handle:
//   - ".next/server/app/admin.html"   → the /admin root page
//   - ".next/server/app/admin/login.html" → sub-pages
//   - "/admin" → after Serwist's URL rewriter has run
//   - "/api/..." → API routes
const ADMIN_API_REGEX = /(?:^|\/)admin(\.html|\/|$)|(?:^|\/)api\//;

// Note: serwist() is async — it loads next.config internally.
// Top-level await is valid because package.json has "type": "module".
export default await serwist({
  swSrc: "modules/pwa/service-worker/sw.js",
  swDest: "public/sw.js",

  precachePrerendered: true,

  // Increase the maximum file size limit for precaching to 50MB
  // This allows large assets like the 13.7MB 4K hero video to be precached for offline use.
  maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,

  // Layer 1 — dist-relative glob ignores (before any transforms run)
  // Serwist already ignores: _not-found.html, _global-error*, 404.html, 500.html
  //
  // NOTE: /admin maps to .next/server/app/admin.html (a file, not inside admin/),
  // so admin/**/*.html alone misses it. We must include admin.html explicitly.
  globIgnores: [
    ".next/server/app/admin.html", // the /admin root page
    ".next/server/app/admin/**/*.html", // all nested /admin/* pages
    ".next/server/app/api/**",
  ],

  // Layer 2 — filter both dist path form and rewritten URL form
  manifestTransforms: [
    (entries) => ({
      manifest: entries.filter((e) => !ADMIN_API_REGEX.test(e.url)),
      warnings: [],
    }),
  ],
});
