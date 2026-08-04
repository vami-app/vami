/**
 * Server Instrumentation — Next.js 16
 *
 * This file runs ONCE per Node.js process initialization, before any request
 * is handled. It is the correct place to:
 *   - Register event bus listeners (domain side-effects)
 *   - Initialize observability tooling (Sentry, OTel, etc.)
 *   - Log server startup context
 *
 * In serverless environments (Vercel), this runs on each cold start.
 * Warm invocations reuse the process — listeners persist across them.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logger } = await import('@/lib/logger');
    const { on } = await import('@/lib/events');
    const { MediaService } = await import('@/services/media.service');

    // ── Register Domain Event Listeners ────────────────────────────────────
    // 'media:cleanup' is emitted by blog, product, and category delete mutations.
    // The MediaService listener handles background Cloudinary asset deletion
    // without the service knowing about Cloudinary directly.
    on('media:cleanup', (urls) => {
      MediaService.deleteAssetsInBackground(urls);
    });

    // ── Server Startup Log ──────────────────────────────────────────────────
    logger.info('Server instrumentation initialized', {
      domain: 'bootstrap',
      nodeVersion: process.version,
      env: process.env.NODE_ENV,
    });
  }
}
