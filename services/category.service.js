import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

/**
 * Fetches all categories.
 */
export const getAllCategories = unstable_cache(
  async (limit = 0) => {
    await dbConnect();
    let query = Category.find({}).sort({ createdAt: -1 });
    if (limit) query = query.limit(limit);
    return await query.lean();
  },
  ['all-categories'],
  { tags: ['categories'], revalidate: 86400 }
);

/**
 * Fetches a single category by slug.
 */
export const getCategoryBySlug = unstable_cache(
  async (slug) => {
    await dbConnect();
    return await Category.findOne({ slug }).lean();
  },
  ['category-by-slug'],
  { tags: ['categories'], revalidate: 86400 }
);
