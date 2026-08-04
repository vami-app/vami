import { cache } from 'react';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

/**
 * Fetches all published blog posts.
 */
export const getPublishedBlogPosts = cache(async () => {
  await dbConnect();
  return await BlogPost.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
});

/**
 * Fetches a single published blog post by slug.
 */
export const getBlogPostBySlug = cache(async (slug) => {
  await dbConnect();
  return await BlogPost.findOne({ slug, status: 'published' }).lean();
});

/**
 * Fetches a single blog post by ID (for admin editing).
 */
export const getBlogPostById = cache(async (id) => {
  await dbConnect();
  return await BlogPost.findById(id).lean();
});
