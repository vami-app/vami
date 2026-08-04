import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { emit } from '@/lib/events';

// ─── READS (Cached via 'use cache' directive) ────────────────────────────────

/**
 * Fetches all published blog posts, sorted by publishedAt descending.
 * Cache is tagged 'blog' — revalidated by revalidateTag('blog') on any mutation.
 */
export async function getPublishedBlogPosts() {
  'use cache';
  cacheTag('blog');
  cacheLife('hours');
  await dbConnect();
  return BlogPost.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
}

/**
 * Fetches a single published blog post by slug.
 * Individually tagged so a specific post can be precisely invalidated.
 */
export async function getBlogPostBySlug(slug) {
  'use cache';
  cacheTag('blog', `post:${slug}`);
  cacheLife('hours');
  await dbConnect();
  return BlogPost.findOne({ slug, status: 'published' }).lean();
}

/**
 * Fetches a single blog post by ID (for admin editing — short cache).
 */
export async function getBlogPostById(id) {
  'use cache';
  cacheTag('blog', `post-id:${id}`);
  cacheLife('minutes');
  await dbConnect();
  return BlogPost.findById(id).lean();
}

// ─── ADMIN QUERIES (Uncached — always fresh for admin views) ─────────────────

export const getBlogListUncached = async () => {
  await dbConnect();
  return BlogPost.find({}).sort({ createdAt: -1 }).lean();
};

export const getBlogPostByIdUncached = async (id) => {
  await dbConnect();
  return BlogPost.findById(id).lean();
};

// ─── MUTATIONS (Uncached + Cache Invalidation) ────────────────────────────────

export const createBlogPost = async (data) => {
  await dbConnect();
  const post = await BlogPost.create(data);
  // Invalidate the entire blog cache so new post appears immediately
  revalidateTag('blog');
  revalidateTag('stats'); // Refresh dashboard counts
  return post;
};

export const updateBlogPost = async (id, data) => {
  await dbConnect();
  const post = await BlogPost.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (post) {
    // Invalidate whole blog list + specific post cache entries
    revalidateTag('blog');
    revalidateTag(`post:${post.slug}`);
    revalidateTag(`post-id:${id}`);
  }

  return post;
};

export const deleteBlogPost = async (id) => {
  await dbConnect();
  const post = await BlogPost.findByIdAndDelete(id).lean();

  if (post) {
    revalidateTag('blog');
    revalidateTag(`post:${post.slug}`);
    revalidateTag('stats'); // Refresh dashboard counts
    // Emit event — media cleanup listener registered in instrumentation.js
    emit('media:cleanup', post.coverImage ? [post.coverImage] : []);
  }

  return post;
};
