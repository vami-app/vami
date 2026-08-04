import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { emit } from '@/lib/events';

// ─── READS (Cached) ──────────────────────────────────────────────────────────

export async function getAllCategories(limit = 0) {
  'use cache';
  cacheTag('categories');
  cacheLife('hours');
  await dbConnect();
  let query = Category.find({}).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  return query.lean();
}

export async function getCategoryBySlug(slug) {
  'use cache';
  cacheTag('categories', `category:${slug}`);
  cacheLife('hours');
  await dbConnect();
  return Category.findOne({ slug }).lean();
}

// ─── ADMIN QUERIES (Uncached) ─────────────────────────────────────────────────

export const getCategoryByIdUncached = async (id) => {
  await dbConnect();
  return Category.findById(id).lean();
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const createCategory = async (data) => {
  await dbConnect();
  const category = await Category.create(data);
  revalidateTag('categories');
  revalidateTag('stats'); // Refresh dashboard counts
  return category;
};

export const updateCategory = async (id, data) => {
  await dbConnect();
  const category = await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (category) {
    revalidateTag('categories');
    revalidateTag(`category:${category.slug}`);
  }

  return category;
};

export const deleteCategory = async (id) => {
  await dbConnect();
  const category = await Category.findByIdAndDelete(id).lean();

  if (category) {
    revalidateTag('categories');
    revalidateTag('stats'); // Refresh dashboard counts
    emit('media:cleanup', category.image ? [category.image] : []);
  }

  return category;
};
