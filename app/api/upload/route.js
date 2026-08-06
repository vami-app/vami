import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// ─── Security Policy ──────────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;        // 5 MB decoded
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const ALLOWED_FOLDERS = new Set(['products', 'blog', 'categories', 'general']);

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const { file, folder = 'general' } = body;

  if (!file) {
    return NextResponse.json({ error: 'File data is required' }, { status: 400 });
  }

  // ── 1. Folder Allowlist (prevent path traversal on Cloudinary) ────────────
  if (!ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json({ error: 'Invalid upload destination folder' }, { status: 400 });
  }

  // ── 2. MIME Type Validation (from data URI prefix) ────────────────────────
  const mimeMatch = file.match(/^data:([^;]+);base64,/);
  if (!mimeMatch) {
    return NextResponse.json({ error: 'File must be a valid base64 data URI' }, { status: 400 });
  }
  const mimeType = mimeMatch[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    logger.warn('Upload rejected: disallowed MIME type', { domain: 'media', mimeType });
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: JPEG, PNG, WebP, GIF' },
      { status: 415 }
    );
  }

  // ── 3. File Size Validation (check before sending to Cloudinary) ──────────
  const base64Data = file.replace(/^data:[^;]+;base64,/, '');
  // Base64 encodes 3 bytes → 4 chars; decoded size ≈ (base64Length * 3) / 4
  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
    logger.warn('Upload rejected: file too large', {
      domain: 'media',
      estimatedBytes,
      maxBytes: MAX_FILE_SIZE_BYTES,
    });
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB` },
      { status: 413 }
    );
  }

  const { MediaService } = await import('@/modules/media/media.service');
  const result = await MediaService.uploadMedia(file, folder);

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id,
  });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_MEDIA });
