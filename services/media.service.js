import { unstable_after as after } from 'next/server';
import { deleteImage, uploadImage, uploadRaw } from '@/lib/cloudinary';
import { logger } from '@/lib/logger';

/**
 * Domain Service for orchestrating Media Lifecycle Events.
 *
 * Upload: streams base64 → Cloudinary via server SDK (API secret stays server-side)
 * Delete: executes in background via unstable_after so it does NOT block HTTP response (TTFB)
 *
 * This service is consumed by:
 *   - /api/upload route (direct admin uploads)
 *   - Event bus listener registered in instrumentation.js (automated cleanup)
 */
export const MediaService = {
  /**
   * Upload an image to Cloudinary.
   * @param {string} fileBase64 — data URI or raw base64 string
   * @param {string} [folder='general'] — target Cloudinary folder
   */
  async uploadMedia(fileBase64, folder = 'general') {
    return uploadImage(fileBase64, folder);
  },

  /**
   * Upload a raw file (PDF/DWG/DXF/etc.) to Cloudinary.
   * @param {string} fileBase64
   * @param {string} [folder='leads']
   * @param {string} [filename]
   */
  async uploadRawMedia(fileBase64, folder = 'leads', filename) {
    return uploadRaw(fileBase64, folder, filename);
  },

  /**
   * Extracts the Cloudinary public_id from a delivery URL.
   * Handles optional version strings (e.g., v1234567890/).
   *
   * @param {string} url
   * @returns {string | null}
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    try {
      const parts = url.split('/upload/');
      if (parts.length !== 2) return null;
      // Remove version prefix (e.g., "v1234567890/")
      const withoutVersion = parts[1].replace(/^v\d+\//, '');
      // Remove file extension
      const dotIndex = withoutVersion.lastIndexOf('.');
      return dotIndex !== -1 ? withoutVersion.substring(0, dotIndex) : withoutVersion;
    } catch {
      logger.error('Failed to parse Cloudinary URL', { domain: 'media', url });
      return null;
    }
  },

  /**
   * Deletes Cloudinary assets asynchronously AFTER the HTTP response is sent.
   * Uses Next.js `unstable_after` to guarantee execution without blocking TTFB.
   * Errors in individual deletions are caught and logged — they never surface to the caller.
   *
   * @param {string[]} urls — Cloudinary delivery URLs to delete
   */
  deleteAssetsInBackground(urls) {
    if (!urls || !Array.isArray(urls) || urls.length === 0) return;

    after(async () => {
      logger.info('Background media cleanup started', {
        domain: 'media',
        count: urls.length,
      });

      const results = await Promise.allSettled(
        urls.map(async (url) => {
          const publicId = this.extractPublicIdFromUrl(url);
          if (!publicId) {
            logger.warn('Could not extract publicId from URL — skipping', { domain: 'media', url });
            return;
          }
          await deleteImage(publicId);
          logger.debug('Asset deleted', { domain: 'media', publicId });
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        logger.warn('Some assets failed to delete during background cleanup', {
          domain: 'media',
          failedCount: failed.length,
          errors: failed.map((r) => r.reason?.message),
        });
      }

      logger.info('Background media cleanup complete', { domain: 'media', count: urls.length });
    });
  },
};
