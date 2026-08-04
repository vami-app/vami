import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async () => {
  const { getSiteSettingsUncached } = await import('@/modules/settings');
  const settings = await getSiteSettingsUncached();
  return NextResponse.json(settings);
});

export const PUT = withApiHandler(async (req) => {
  const body = await req.json();

  const { updateSiteSettings } = await import('@/modules/settings');
  const settings = await updateSiteSettings(body);

  return NextResponse.json(settings);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_SETTINGS });
