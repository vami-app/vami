import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin';
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

  const admin = await Admin.findOne({ email: decoded.email });
  if (!admin) return NextResponse.json({ error: 'Admin not found' }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  admin.passwordHash = await bcrypt.hash(newPassword, 12);
  await admin.save();

  return NextResponse.json({ message: 'Password updated successfully' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_SETTINGS });
