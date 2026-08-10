import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { emit } from '@/lib/events';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

// ─── READS (Cached) ──────────────────────────────────────────────────────────

export async function getAllCategories(limit = 0) {
  'use cache';
  cacheTag('categories');
  cacheLife('hours');
  try {
    await dbConnect();
    let query = Category.find({}).sort({ createdAt: -1 });
    if (limit) query = query.limit(limit);
    const categories = await query.lean();
    return serializeDocs(categories);
  } catch {
    return [];
  }
}

export async function getCategoryBySlug(slug) {
  'use cache';
  cacheTag('categories', `category:${slug}`);
  cacheLife('hours');
  try {
    await dbConnect();
    const category = await Category.findOne({ slug }).lean();
    return serializeDoc(category);
  } catch {
    return null;
  }
}

// ─── ADMIN QUERIES (Uncached) ─────────────────────────────────────────────────

export const getCategoryByIdUncached = async (id) => {
  await dbConnect();
  const category = await Category.findById(id).lean();
  return serializeDoc(category);
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const createCategory = async (data) => {
  await dbConnect();
  const category = await Category.create(data);
  revalidateTag('categories');
  revalidateTag('stats'); // Refresh dashboard counts
  return serializeDoc(category.toObject ? category.toObject() : category);
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

  return serializeDoc(category);
};

export const deleteCategory = async (id) => {
  await dbConnect();
  const category = await Category.findByIdAndDelete(id).lean();

  if (category) {
    revalidateTag('categories');
    revalidateTag('stats'); // Refresh dashboard counts
    emit('media:cleanup', category.image ? [category.image] : []);
  }

  return serializeDoc(category);
};
