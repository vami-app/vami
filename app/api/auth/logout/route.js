import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withApiHandler } from '@/lib/apiHandler';
import { env } from '@/env.mjs';

export const POST = withApiHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  cookieStore.delete('auth_token');
  
  const response = NextResponse.json({ message: 'Logged out successfully' });
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
});
