import { NextResponse } from 'next/server';
import BlogPost from '@/models/BlogPost';
import { BlogPostSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  
  let query = {};
  if (status) query.status = status;
  
  const posts = await BlogPost.find(query).sort({ createdAt: -1 });
  return NextResponse.json(posts);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();
  
  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const post = await BlogPost.create(parsed.data);
  return NextResponse.json(post, { status: 201 });
}, { requireAuth: true });
