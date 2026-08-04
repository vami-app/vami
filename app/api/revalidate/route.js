import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withApiHandler } from '@/lib/apiHandler';
import { env } from '@/env.mjs';

export const POST = withApiHandler(async (req) => {
  const secret = req.nextUrl.searchParams.get('secret');
  
  if (secret !== env.JWT_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const body = await req.json();
  const { tag } = body;

  if (!tag) {
    return NextResponse.json({ message: 'Missing tag param' }, { status: 400 });
  }

  revalidateTag(tag);

  return NextResponse.json({ revalidated: true, now: Date.now(), tag });
});
