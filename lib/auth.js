import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { env } from '@/env.mjs';

const JWT_SECRET = env.JWT_SECRET;

// ─── Token Expiry ──────────────────────────────────────────────────────────────
// 4 hours: short enough to limit blast radius if stolen, long enough for a
// full admin work session. Token version check (below) enables instant
// revocation without needing a shorter window.
const ACCESS_TOKEN_EXPIRY = '4h';

/** @param {{ adminId: string, role: string, permissions: string[], version: number, email: string }} payload */
export async function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** @returns {object | null} Decoded payload or null if invalid/expired */
export async function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

/**
 * requireAuth — Used in API route handlers.
 *
 * Verifies the JWT statelessy, then performs ONE lightweight DB check
 * (SELECT tokenVersion only) to validate the session has not been revoked.
 * This enables instant invalidation via password change or "sign out all".
 *
 * @returns {{ decoded: object } | { error: NextResponse }}
 */
export async function requireAuth(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }

  // ─── Token Version Check (Session Revocation) ─────────────────────────────
  // Only runs if decoded.version is present (new tokens after Admin model update).
  if (decoded.version !== undefined) {
    const dbConnect = (await import('@/lib/db')).default;
    const Admin = (await import('@/models/Admin')).default;
    await dbConnect();

    const admin = await Admin.findById(decoded.adminId).select('tokenVersion').lean();
    if (!admin || admin.tokenVersion !== decoded.version) {
      return {
        error: NextResponse.json({ error: 'Session revoked. Please log in again.' }, { status: 401 }),
      };
    }
  }

  return { decoded };
}

/**
 * requireAuthPage — Used in Server Component page guards.
 * Redirects to /admin/login if the session is invalid.
 */
export async function requireAuthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/admin/login');

  const decoded = await verifyToken(token);
  if (!decoded) redirect('/admin/login');

  // Token version check for page guard
  if (decoded.version !== undefined) {
    const dbConnect = (await import('@/lib/db')).default;
    const Admin = (await import('@/models/Admin')).default;
    await dbConnect();

    const admin = await Admin.findById(decoded.adminId).select('tokenVersion').lean();
    if (!admin || admin.tokenVersion !== decoded.version) {
      redirect('/admin/login');
    }
  }

  return decoded;
}

/**
 * Invalidates ALL active sessions for an admin by incrementing tokenVersion.
 * Any existing JWT with the old version will be rejected on next request.
 *
 * @param {string} adminId
 */
export async function invalidateAllSessions(adminId) {
  const dbConnect = (await import('@/lib/db')).default;
  const Admin = (await import('@/models/Admin')).default;
  await dbConnect();
  await Admin.findByIdAndUpdate(adminId, { $inc: { tokenVersion: 1 } });
}
