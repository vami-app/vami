import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  await dbConnect();
  const settings = await SiteSettings.findById('site').lean();
  return NextResponse.json(settings || {});
}

export async function PUT(req) {
  const authError = await requireAuth(req);
  if (authError) return authError;

  await dbConnect();
  const body = await req.json();

  // Upsert the singleton settings document
  const settings = await SiteSettings.findByIdAndUpdate(
    'site',
    { $set: body },
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.json(settings);
}
