import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { emit } from '@/lib/events';
import { serializeDoc, serializeDocs } from '@/lib/serialize';
import { buildCursorQuery, buildRelayConnection } from '@/lib/pagination';

// ─── READS (Cached) ──────────────────────────────────────────────────────────

/**
 * Fetches a published product by its category slug + product slug.
 * Arguments are automatically part of the cache key — no collision possible.
 */
export async function getProductBySlug(categorySlug, productSlug) {
  'use cache';
  cacheTag('products', 'categories', `product:${categorySlug}:${productSlug}`);
  cacheLife('hours');
  await dbConnect();

  const category = await Category.findOne({ slug: categorySlug }).lean();
  if (!category) return null;

  const product = await Product.findOne({
    slug: productSlug,
    category: category._id,
    status: 'published',
  }).lean();

  if (!product) return null;
  return { product: serializeDoc(product), category: serializeDoc(category) };
}

/**
 * Fetches all published products in a category.
 */
export async function getProductsByCategory(categoryId) {
  'use cache';
  cacheTag('products', `category-products:${categoryId}`);
  cacheLife('hours');
  await dbConnect();
  const products = await Product.find({ category: categoryId, status: 'published' }).lean();
  return serializeDocs(products);
}

/**
 * Fetches published products using cursor pagination (Relay Connection spec).
 * @param {{ cursor?: string, limit?: number }} opts 
 */
export async function getAllPublishedProducts({ cursor = null, limit = 20 } = {}) {
  'use cache';
  cacheTag('products', 'categories');
  cacheLife('hours');
  await dbConnect();
  
  const baseQuery = { status: 'published' };
  const cursorQuery = cursor ? buildCursorQuery(cursor, 'createdAt', true) : {};
  const query = { ...baseQuery, ...cursorQuery };

  // Fetch limit + 1 to determine if there's a next page
  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();
    
  return buildRelayConnection(serializeDocs(products), limit, 'createdAt');
}

/**
 * Fetches featured products for homepage.
 */
export async function getFeaturedProducts(limit = 4) {
  'use cache';
  cacheTag('products', 'categories');
  cacheLife('hours');
  await dbConnect();
  const products = await Product.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .lean();
  return serializeDocs(products);
}

/**
 * Fetches a single product by ID (for admin editing — short TTL).
 */
export async function getProductById(id) {
  'use cache';
  cacheTag('products', `product-id:${id}`);
  cacheLife('minutes');
  await dbConnect();
  const product = await Product.findById(id).lean();
  return serializeDoc(product);
}

// ─── ADMIN QUERIES (Uncached + Paginated) ────────────────────────────────────

/**
 * Paginated product list for admin panel.
 * Uses FAANG-grade Keyset/Cursor pagination.
 *
 * @param {{ categoryId?: string|null, cursor?: string|null, limit?: number }} opts
 */
export const getProductsList = async ({ categoryId = null, cursor = null, limit = 20 } = {}) => {
  await dbConnect();
  const baseQuery = categoryId ? { category: categoryId } : {};
  const cursorQuery = cursor ? buildCursorQuery(cursor, 'createdAt', true) : {};
  const query = { ...baseQuery, ...cursorQuery };

  const products = await Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .lean();

  return buildRelayConnection(serializeDocs(products), limit, 'createdAt');
};

export const getProductByIdUncached = async (id) => {
  await dbConnect();
  const product = await Product.findById(id).populate('category', 'name slug').lean();
  return serializeDoc(product);
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const createProduct = async (data) => {
  await dbConnect();
  const product = await Product.create(data);
  revalidateTag('products');
  revalidateTag('stats'); // Refresh dashboard counts
  return serializeDoc(product.toObject ? product.toObject() : product);
};

export const updateProduct = async (id, data) => {
  await dbConnect();
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (product) {
    revalidateTag('products');
    revalidateTag(`product-id:${id}`);
  }

  return serializeDoc(product);
};

export const deleteProduct = async (id) => {
  await dbConnect();
  const product = await Product.findByIdAndDelete(id).lean();

  if (product) {
    revalidateTag('products');
    revalidateTag(`product-id:${id}`);
    revalidateTag('stats'); // Refresh dashboard counts
    // Collect all image URLs across main gallery + variants for cleanup
    const allImages = [
      ...(product.images || []),
      ...(product.variants || []).flatMap((v) => v.images || []),
    ].filter(Boolean);
    emit('media:cleanup', allImages);
  }

  return serializeDoc(product);
};
