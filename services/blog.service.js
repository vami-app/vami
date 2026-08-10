import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { emit } from '@/lib/events';
import { serializeDoc, serializeDocs } from '@/lib/serialize';
import { buildCursorQuery, buildRelayConnection } from '@/lib/pagination';

// ─── READS (Cached via 'use cache' directive) ────────────────────────────────

/**
 * Fetches published blog posts using cursor pagination (Relay Connection spec).
 * Cache is tagged 'blog' — revalidated by revalidateTag('blog') on any mutation.
 * @param {{ cursor?: string, limit?: number }} opts 
 */
export async function getPublishedBlogPosts({ cursor = null, limit = 20 } = {}) {
  'use cache';
  cacheTag('blog');
  cacheLife('hours');
  try {
    await dbConnect();

    const baseQuery = { status: 'published' };
    const cursorQuery = cursor ? buildCursorQuery(cursor, 'publishedAt', true) : {};
    const query = { ...baseQuery, ...cursorQuery };

    const posts = await BlogPost.find(query)
      .sort({ publishedAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    return buildRelayConnection(serializeDocs(posts), limit, 'publishedAt');
  } catch {
    return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
}

/**
 * Fetches a single published blog post by slug.
 * Individually tagged so a specific post can be precisely invalidated.
 */
export async function getBlogPostBySlug(slug) {
  'use cache';
  cacheTag('blog', `post:${slug}`);
  cacheLife('hours');
  try {
    await dbConnect();
    const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
    return serializeDoc(post);
  } catch {
    return null;
  }
}

/**
 * Fetches a single blog post by ID (for admin editing — short cache).
 */
export async function getBlogPostById(id) {
  'use cache';
  cacheTag('blog', `post-id:${id}`);
  cacheLife('minutes');
  await dbConnect();
  const post = await BlogPost.findById(id).lean();
  return serializeDoc(post);
}

// ─── ADMIN QUERIES (Uncached — always fresh for admin views) ─────────────────

export const getBlogListUncached = async ({ cursor = null, limit = 20 } = {}) => {
  await dbConnect();
  
  const baseQuery = {};
  // For uncached list, we probably want to sort by createdAt, not publishedAt (since drafts don't have publishedAt)
  // But wait, the schema index is on publishedAt.
  // Actually, drafts might not have publishedAt. Let's sort by createdAt for admin list to match what it had.
  const cursorQuery = cursor ? buildCursorQuery(cursor, 'createdAt', true) : {};
  const query = { ...baseQuery, ...cursorQuery };
  
  const posts = await BlogPost.find(query)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
    
  return buildRelayConnection(serializeDocs(posts), limit, 'createdAt');
};

export const getBlogPostByIdUncached = async (id) => {
  await dbConnect();
  const post = await BlogPost.findById(id).lean();
  return serializeDoc(post);
};

// ─── MUTATIONS (Uncached + Cache Invalidation) ────────────────────────────────

export const createBlogPost = async (data) => {
  await dbConnect();
  const post = await BlogPost.create(data);
  // Invalidate the entire blog cache so new post appears immediately
  revalidateTag('blog');
  revalidateTag('stats'); // Refresh dashboard counts
  return serializeDoc(post.toObject ? post.toObject() : post);
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

  return serializeDoc(post);
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

  return serializeDoc(post);
};
