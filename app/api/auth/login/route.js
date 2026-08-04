import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Admin from '@/models/Admin';
import { signToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { withApiHandler } from '@/lib/apiHandler';

export const POST = withApiHandler(async (req) => {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = await signToken({ adminId: admin._id });
  const cookieStore = await cookies();
  
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return NextResponse.json({ message: 'Logged in successfully' });
});
