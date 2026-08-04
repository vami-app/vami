import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const PUT = withApiHandler(async (req) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  const decoded = await verifyToken(token);

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both fields are required' }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  const { updateAdminPassword } = await import('@/modules/auth');
  const result = await updateAdminPassword(decoded.email, currentPassword, newPassword);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ message: 'Password updated successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_SETTINGS });
