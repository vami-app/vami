import { cache } from 'react';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const getProductBySlug = cache(async (categorySlug, productSlug) => {
  await dbConnect();

  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) return null;

  const product = await Product.findOne({
    slug: productSlug,
    category: category._id,
    status: 'published',
  }).lean();

  if (!product) return null;

  return { product, category };
});

export const getProductsByCategory = cache(async (categoryId) => {
  await dbConnect();
  return await Product.find({ category: categoryId, status: 'published' }).lean();
});

export const getAllPublishedProducts = cache(async () => {
  await dbConnect();
  return await Product.find({ status: 'published' }).populate('category', 'name slug').sort({ createdAt: -1 }).lean();
});

export const getFeaturedProducts = cache(async (limit = 4) => {
  await dbConnect();
  return await Product.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .lean();
});

export const getProductById = cache(async (id) => {
  await dbConnect();
  return await Product.findById(id).lean();
});
