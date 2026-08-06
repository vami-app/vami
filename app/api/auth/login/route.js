import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/apiHandler';
import { env } from '@/env.mjs';

// ─── Cookie Configuration ───────────────────────────────────────────────────
// 4 hours: aligned with JWT ACCESS_TOKEN_EXPIRY in lib/auth.js.
// Shorter than the previous 7 days to limit blast radius if token is stolen.
// tokenVersion check in lib/auth.js provides instant revocation regardless.
const COOKIE_MAX_AGE_SECONDS = 4 * 60 * 60; // 4 hours

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const { authenticateAdmin } = await import('@/modules/auth/auth.service');
  const result = await authenticateAdmin(email, password);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const response = NextResponse.json({ message: 'Login successful' });

  response.cookies.set('auth_token', result.token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return response;
});
