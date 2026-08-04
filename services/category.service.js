import { cache } from 'react';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

/**
 * Fetches all categories.
 */
export const getAllCategories = cache(async (limit = 0) => {
  await dbConnect();
  let query = Category.find({}).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  return await query.lean();
});

/**
 * Fetches a single category by slug.
 */
export const getCategoryBySlug = cache(async (slug) => {
  await dbConnect();
  return await Category.findOne({ slug }).lean();
});
