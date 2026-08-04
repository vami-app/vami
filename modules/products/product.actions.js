'use server';

import { getAllPublishedProducts } from './product.service';

/**
 * Server action to fetch a page of published products.
 * Used for infinite scroll in client components.
 * 
 * @param {string} cursor 
 */
export async function loadMoreProducts(cursor) {
  try {
    const data = await getAllPublishedProducts({ cursor, limit: 12 });
    // Strip Mongoose documents to plain objects for Server Actions
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error('Failed to load more products:', error);
    return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
  }
}
