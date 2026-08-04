'use server';

import { getPublishedBlogPosts } from './blog.service';

/**
 * Server action to fetch a page of published blog posts.
 * Used for infinite scroll in client components.
 * 
 * @param {string} cursor 
 */
export async function loadMoreBlogPosts(cursor) {
  try {
    const data = await getPublishedBlogPosts({ cursor, limit: 12 });
    // Strip Mongoose documents to plain objects for Server Actions
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Failed to load more blog posts:', error);
    return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
}
