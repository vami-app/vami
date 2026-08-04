/**
 * Media Module — Cloudinary Client (canonical)
 * Moved from lib/cloudinary.js — encapsulated within the media domain.
 */
export {
  uploadImage,
  deleteImage,
  generateUploadSignature,
  default as cloudinaryClient,
} from '@/lib/cloudinary';
