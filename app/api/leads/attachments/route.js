import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { MediaService } from '@/services/media.service';
import { checkRateLimit } from '@/services/lead.service';
import { logger } from '@/lib/logger';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/acad',
  'application/x-dwg',
  'application/dwg',
  'application/dxf',
  'image/vnd.dwg',
  'image/x-dwg',
  'application/octet-stream',
]);

const ALLOWED_EXT = new Set(['pdf', 'dwg', 'dxf', 'jpg', 'jpeg', 'png']);

export const POST = withApiHandler(async (req) => {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  if (!checkRateLimit(`lead-upload:${ip}`, 20)) {
    return NextResponse.json({ error: 'Too many uploads. Please try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const { file, filename = 'drawing.pdf' } = body;

  if (!file || typeof file !== 'string') {
    return NextResponse.json({ error: 'File data is required' }, { status: 400 });
  }

  const mimeMatch = file.match(/^data:([^;]+);base64,/);
  if (!mimeMatch) {
    return NextResponse.json({ error: 'File must be a valid base64 data URI' }, { status: 400 });
  }

  const mimeType = mimeMatch[1].toLowerCase();
  const ext = String(filename).split('.').pop()?.toLowerCase() || '';

  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: PDF, DWG, DXF, JPG, PNG' },
      { status: 415 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType) && mimeType !== 'application/octet-stream') {
    logger.warn('Lead attachment rejected: MIME', { domain: 'leads', mimeType });
    return NextResponse.json(
      { error: 'Unsupported file type. Allowed: PDF, DWG, DXF, JPG, PNG' },
      { status: 415 }
    );
  }

  const base64Data = file.replace(/^data:[^;]+;base64,/, '');
  const estimatedBytes = Math.ceil((base64Data.length * 3) / 4);
  if (estimatedBytes > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 413 });
  }

  const result = await MediaService.uploadRawMedia(file, 'leads', filename);

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id,
    filename,
    mimeType,
    bytes: estimatedBytes,
  });
});
