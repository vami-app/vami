import { NextResponse } from 'next/server';
import { BlogPostSchema } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';
import { getBlogPostByIdUncached, updateBlogPost, deleteBlogPost } from '@/services/blog.service';

export const GET = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  const post = await getBlogPostByIdUncached(id);
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

  const post = await updateBlogPost(id, parsed.data);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  
  return NextResponse.json(post);
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });

export const DELETE = withApiHandler(async (req, { params }) => {
  const { id } = await params;
  
  const post = await deleteBlogPost(id);
  if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
  
  return NextResponse.json({ message: 'Blog post deleted successfully (Background Cloudinary cleanup initiated)' });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });
