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

// ─── MUTATIONS & ADMIN QUERIES (Uncached) ─────────────────────────
import { MediaService } from './media.service';

export const getCategoryByIdUncached = async (id) => {
  await dbConnect();
  return await Category.findById(id).lean();
};

export const createCategory = async (data) => {
  await dbConnect();
  return await Category.create(data);
};

export const updateCategory = async (id, data) => {
  await dbConnect();
  return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteCategory = async (id) => {
  await dbConnect();
  const category = await Category.findByIdAndDelete(id).lean();
  
  if (category && category.image) {
    MediaService.deleteAssetsInBackground([category.image]);
  }
  
  return category;
};
