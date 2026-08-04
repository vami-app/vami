import { NextResponse } from 'next/server';
import SiteSettings from '@/models/SiteSettings';
import { withApiHandler } from '@/lib/apiHandler';

export const GET = withApiHandler(async () => {
  const settings = await SiteSettings.findById('site').lean();
  return NextResponse.json(settings || {});
});

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();

  const settings = await SiteSettings.findByIdAndUpdate(
    'site',
    { $set: body },
    { new: true, upsert: true, runValidators: true }
  );

  return NextResponse.json(settings);
}, { requireAuth: true });
