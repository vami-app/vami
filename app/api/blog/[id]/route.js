import { NextResponse } from 'next/server';
import BlogPost from '@/models/BlogPost';
import { BlogPostSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const post = await BlogPost.findById(id);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  return NextResponse.json(post);
});

export const PUT = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const body = await req.json();
  
  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
  }

  const post = await BlogPost.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  
  return NextResponse.json(post);
}, { requireAuth: true });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const post = await BlogPost.findByIdAndDelete(id);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  
  return NextResponse.json({ message: 'Blog post deleted successfully' });
}, { requireAuth: true });
