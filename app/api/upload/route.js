import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const { file, folder = 'general' } = body;

  if (!file) {
    return NextResponse.json({ error: 'File data is required' }, { status: 400 });
  }

  // Expecting base64 string
  const result = await uploadImage(file, folder);

  return NextResponse.json({
    url: result.secure_url,
    public_id: result.public_id,
  });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_MEDIA });
