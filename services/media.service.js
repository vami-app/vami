import { unstable_after as after } from 'next/server';
import { deleteImage, uploadImage } from '@/lib/cloudinary';

/**
 * Domain Service for orchestrating Media Lifecycle Events.
 * Decouples Cloudinary HTTP requests from the primary API lifecycle.
 */
export const MediaService = {
  /**
   * Uploads an image payload to Cloudinary.
   */
  async uploadMedia(fileBase64, folder = 'general') {
    return await uploadImage(fileBase64, folder);
  },
  /**
   * Robustly extracts the Cloudinary public_id from a secure delivery URL.
   * Handles optional version strings (v123456789).
   */
  extractPublicIdFromUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    try {
      // Example URL: https://res.cloudinary.com/demo/image/upload/v161234567/smalloys/products/my-image.jpg
      const parts = url.split('/upload/');
      if (parts.length !== 2) return null;
      
      const pathWithVersion = parts[1];
      
      // Remove version (e.g., "v161234567/") if present
      const withoutVersion = pathWithVersion.replace(/^v\d+\//, '');
      
      // Remove file extension
      const lastDotIndex = withoutVersion.lastIndexOf('.');
      const publicId = lastDotIndex !== -1 
        ? withoutVersion.substring(0, lastDotIndex) 
        : withoutVersion;
        
      return publicId;
    } catch (error) {
      console.error('[MediaService] Error parsing Cloudinary URL:', error);
      return null;
    }
  },

  /**
   * Executes Cloudinary asset deletion asynchronously in the background.
   * Utilizes Next.js Serverless `unstable_after` to guarantee execution 
   * WITHOUT blocking the client HTTP response (Time-To-First-Byte).
   */
  deleteAssetsInBackground(urls) {
    if (!urls || !Array.isArray(urls) || urls.length === 0) return;
    
    after(async () => {
      console.log(`[MediaService] Background deletion started for ${urls.length} assets`);
      
      const deletionPromises = urls.map(async (url) => {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) {
          try {
            await deleteImage(publicId);
            console.log(`[MediaService] Successfully deleted asset: ${publicId}`);
          } catch (error) {
            console.error(`[MediaService] Failed to delete asset: ${publicId}`, error);
          }
        }
      });

      // Execute all deletions concurrently in the background
      await Promise.allSettled(deletionPromises);
      console.log(`[MediaService] Background cleanup complete.`);
    });
  }
};
