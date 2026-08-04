import { cacheTag, cacheLife, revalidateTag } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { emit } from '@/lib/events';

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
  return { product, category };
}

/**
 * Fetches all published products in a category.
 */
export async function getProductsByCategory(categoryId) {
  'use cache';
  cacheTag('products', `category-products:${categoryId}`);
  cacheLife('hours');
  await dbConnect();
  return Product.find({ category: categoryId, status: 'published' }).lean();
}

/**
 * Fetches all published products (for sitemap, product listings).
 */
export async function getAllPublishedProducts() {
  'use cache';
  cacheTag('products', 'categories');
  cacheLife('hours');
  await dbConnect();
  return Product.find({ status: 'published' })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Fetches featured products for homepage.
 */
export async function getFeaturedProducts(limit = 4) {
  'use cache';
  cacheTag('products', 'categories');
  cacheLife('hours');
  await dbConnect();
  return Product.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .lean();
}

/**
 * Fetches a single product by ID (for admin editing — short TTL).
 */
export async function getProductById(id) {
  'use cache';
  cacheTag('products', `product-id:${id}`);
  cacheLife('minutes');
  await dbConnect();
  return Product.findById(id).lean();
}

// ─── ADMIN QUERIES (Uncached + Paginated) ────────────────────────────────────

/**
 * Paginated product list for admin panel.
 * Offset-based pagination (stable for small admin catalogs).
 *
 * @param {{ categoryId?: string|null, page?: number, limit?: number }} opts
 */
export const getProductsList = async ({ categoryId = null, page = 1, limit = 20 } = {}) => {
  await dbConnect();
  const query = categoryId ? { category: categoryId } : {};
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const getProductByIdUncached = async (id) => {
  await dbConnect();
  return Product.findById(id).populate('category', 'name slug').lean();
};

// ─── MUTATIONS ────────────────────────────────────────────────────────────────

export const createProduct = async (data) => {
  await dbConnect();
  const product = await Product.create(data);
  revalidateTag('products');
  revalidateTag('stats'); // Refresh dashboard counts
  return product;
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

  return product;
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

  return product;
};
