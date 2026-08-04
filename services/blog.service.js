import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

/**
 * Fetches all published blog posts.
 */
export const getPublishedBlogPosts = unstable_cache(
  async () => {
    await dbConnect();
    return await BlogPost.find({ status: 'published' }).sort({ createdAt: -1 }).lean();
  },
  ['published-blog-posts'],
  { tags: ['blog'], revalidate: 86400 }
);

/**
 * Fetches a single published blog post by slug.
 */
export const getBlogPostBySlug = unstable_cache(
  async (slug) => {
    await dbConnect();
    return await BlogPost.findOne({ slug, status: 'published' }).lean();
  },
  ['blog-post-by-slug'],
  { tags: ['blog'], revalidate: 86400 }
);

/**
 * Fetches a single blog post by ID (for admin editing).
 */
export const getBlogPostById = unstable_cache(
  async (id) => {
    await dbConnect();
    return await BlogPost.findById(id).lean();
  },
  ['blog-post-by-id'],
  { tags: ['blog'], revalidate: 86400 }
);
