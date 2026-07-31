import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { BlogPostSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    await dbConnect();
    
    let query = {};
    if (status) {
      query.status = status;
    }
    
    const posts = await BlogPost.find(query).sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    await dbConnect();
    const body = await req.json();
    
    const parsed = BlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const post = await BlogPost.create(parsed.data);
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Blog post with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}
