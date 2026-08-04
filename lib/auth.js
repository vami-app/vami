import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { env } from '@/env.mjs';

const JWT_SECRET = env.JWT_SECRET;

export async function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  return null; // Null means auth successful
}

export async function requireAuthPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/admin/login');
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    redirect('/admin/login');
  }

  return decoded;
}
