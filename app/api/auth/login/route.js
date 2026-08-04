import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/auth';
import { withApiHandler } from '@/lib/apiHandler';
import { env } from '@/env.mjs';

import { ROLE_PERMISSIONS, ROLES } from '@/lib/permissions';

export const POST = withApiHandler(async (req) => {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const role = admin.role || ROLES.SUPER_ADMIN;
  const permissions = ROLE_PERMISSIONS[role];
  const token = await signToken({ adminId: admin._id, role, permissions });
  const response = NextResponse.json({ message: 'Login successful' });
  
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
});
