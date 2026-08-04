import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { generateUploadSignature } from '@/lib/cloudinary';
import { env } from '@/env.mjs';

const ALLOWED_FOLDERS = new Set(['products', 'blog', 'categories', 'general']);

/**
 * POST /api/upload/sign
 *
 * Generates a Cloudinary upload signature for DIRECT client-to-Cloudinary uploads.
 *
 * This pattern eliminates the base64 upload limitation:
 *   - Files go directly from browser → Cloudinary CDN
 *   - Vercel's 4.5MB body limit is no longer a constraint
 *   - API secret never leaves the server
 *   - Upload speed improves significantly (no server relay hop)
 *
 * Client-side usage:
 *   1. Call POST /api/upload/sign with { folder }
 *   2. Receive { signature, timestamp, cloudName, apiKey, folder, ... }
 *   3. POST directly to https://api.cloudinary.com/v1_1/{cloudName}/image/upload
 *      with the signature and other params
 */
export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const { folder = 'general' } = body;

  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Invalid upload destination folder' }, { status: 400 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const cloudFolder = `smalloys/${folder}`;

  // Parameters that Cloudinary will enforce server-side (signed into request)
  const paramsToSign = {
    timestamp,
    folder: cloudFolder,
    allowed_formats: 'jpg,jpeg,png,gif,webp',
    format: 'webp',
    quality: 'auto:good',
  };

  const signature = generateUploadSignature(paramsToSign);

  return NextResponse.json({
    signature,
    timestamp,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    folder: cloudFolder,
    allowed_formats: paramsToSign.allowed_formats,
    format: paramsToSign.format,
    quality: paramsToSign.quality,
  });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_MEDIA });
