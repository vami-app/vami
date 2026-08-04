import { cache } from 'react';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

/**
 * Fetches a published product by its slug and category slug.
 * Wrapped in React cache() to prevent duplicate database queries
 * during the same request lifecycle (e.g., generateMetadata + Page render).
 */
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
