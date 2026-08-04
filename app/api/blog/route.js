import { NextResponse } from 'next/server';
import { BlogPostSchema, formatZodIssues } from '@/lib/validations';
import { withApiHandler } from '@/lib/apiHandler';
import { PERMISSIONS } from '@/lib/permissions';

export const GET = withApiHandler(async (req) => {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get('cursor') || null;
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  const { getBlogListUncached } = await import('@/modules/blog');
  const posts = await getBlogListUncached({ cursor, limit });
  return NextResponse.json(posts);
});

export const POST = withApiHandler(async (req) => {
  const body = await req.json();

  const parsed = BlogPostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: formatZodIssues(parsed.error) },
      { status: 400 }
    );
  }

  const { createBlogPost } = await import('@/modules/blog');
  const post = await createBlogPost(parsed.data);
  return NextResponse.json(post, { status: 201 });
}, { requireAuth: true, requiredPermission: PERMISSIONS.MANAGE_BLOG });
