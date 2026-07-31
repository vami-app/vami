import { NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { requireAuth } from '@/lib/auth';

export async function POST(req) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
