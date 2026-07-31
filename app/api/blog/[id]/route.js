import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { BlogPostSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();
    const post = await BlogPost.findById(id);
    if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    
    const parsed = BlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const post = await BlogPost.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
    if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    
    return NextResponse.json(post);
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Blog post with this slug already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const authError = await requireAuth(req);
    if (authError) return authError;

    const { id } = await params;
    await dbConnect();
    
    const post = await BlogPost.findByIdAndDelete(id);
    if (!post) return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    
    // Note: In Phase 4, we will add logic here to delete associated Cloudinary images
    
    return NextResponse.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
