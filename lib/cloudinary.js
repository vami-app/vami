import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/env.mjs';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload an image to Cloudinary with automatic optimization.
 *
 * Transformations applied at upload time (free, no extra SDK calls):
 *   - format: 'webp'        — converts to WebP (30-50% smaller than JPEG)
 *   - quality: 'auto:good'  — Cloudinary AI picks optimal quality per image
 *   - width: 1920, crop: 'limit' — caps max dimension; never upscales
 *   - allowed_formats       — defense-in-depth: rejects non-image types at CDN level
 *
 * @param {string} fileBase64 — base64 data URI
 * @param {string} folder     — destination folder name (without prefix)
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export const uploadImage = async (fileBase64, folder) => {
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: `smalloys/${folder}`,
    resource_type: 'image',
    format: 'webp',
    quality: 'auto:good',
    transformation: [{ width: 1920, crop: 'limit' }],
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  });
  return result;
};

/**
 * Delete a Cloudinary asset by its public_id.
 *
 * @param {string} publicId — e.g., 'smalloys/products/my-image'
 * @returns {Promise<import('cloudinary').DeleteApiResponse>}
 */
export const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

/**
 * Upload a non-image file (PDF, DWG, DXF, etc.) as a Cloudinary raw asset.
 * @see https://cloudinary.com/documentation/upload_parameters
 * @param {string} fileBase64 — data URI
 * @param {string} folder — destination folder name (without prefix)
 * @param {string} [filename] — optional public_id filename with extension
 */
export const uploadRaw = async (fileBase64, folder, filename) => {
  const result = await cloudinary.uploader.upload(fileBase64, {
    folder: `smalloys/${folder}`,
    resource_type: 'raw',
    ...(filename ? { public_id: filename.replace(/\.[^.]+$/, ''), format: filename.split('.').pop() } : {}),
  });
  return result;
};

/**
 * Delete a raw Cloudinary asset.
 * @param {string} publicId
 */
export const deleteRaw = async (publicId) => {
  return cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
};

/**
 * Generate a server-side signature for direct (client-to-Cloudinary) uploads.
 * The client uses this signature to upload directly to Cloudinary without
 * the file passing through your server — bypasses Vercel's 4.5MB body limit.
 *
 * @param {Record<string, string|number>} paramsToSign
 * @returns {string} HMAC-SHA256 signature
 */
export const generateUploadSignature = (paramsToSign) => {
  return cloudinary.utils.api_sign_request(paramsToSign, env.CLOUDINARY_API_SECRET);
};

export default cloudinary;
