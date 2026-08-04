import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { env } from '@/env.mjs';

export const POST = withApiHandler(async (req) => {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { authenticateAdmin } = await import('@/services/auth.service');
  const result = await authenticateAdmin(email, password);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ message: 'Login successful' });
  
  response.cookies.set('auth_token', result.token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
});
