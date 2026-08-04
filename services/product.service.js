import { unstable_cache } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';

export const getProductBySlug = unstable_cache(
  async (categorySlug, productSlug) => {
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
  },
  ['product-by-slug'],
  { tags: ['products', 'categories'], revalidate: 86400 }
);

export const getProductsByCategory = unstable_cache(
  async (categoryId) => {
    await dbConnect();
    return await Product.find({ category: categoryId, status: 'published' }).lean();
  },
  ['products-by-category'],
  { tags: ['products'], revalidate: 86400 }
);

export const getAllPublishedProducts = unstable_cache(
  async () => {
    await dbConnect();
    return await Product.find({ status: 'published' }).populate('category', 'name slug').sort({ createdAt: -1 }).lean();
  },
  ['all-published-products'],
  { tags: ['products'], revalidate: 86400 }
);

export const getFeaturedProducts = unstable_cache(
  async (limit = 4) => {
    await dbConnect();
    return await Product.find({ status: 'published', featured: true })
      .populate('category', 'name slug')
      .limit(limit)
      .lean();
  },
  ['featured-products'],
  { tags: ['products'], revalidate: 86400 }
);

export const getProductById = unstable_cache(
  async (id) => {
    await dbConnect();
    return await Product.findById(id).lean();
  },
  ['product-by-id'],
  { tags: ['products'], revalidate: 86400 }
);

// ─── MUTATIONS & ADMIN QUERIES (Uncached) ─────────────────────────
import { MediaService } from './media.service';

export const getProductsList = async (categoryId = null) => {
  await dbConnect();
  let query = {};
  if (categoryId) query.category = categoryId;
  
  return await Product.find(query)
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
};

export const getProductByIdUncached = async (id) => {
  await dbConnect();
  return await Product.findById(id).populate('category', 'name slug').lean();
};

export const createProduct = async (data) => {
  await dbConnect();
  return await Product.create(data);
};

export const updateProduct = async (id, data) => {
  await dbConnect();
  return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

export const deleteProduct = async (id) => {
  await dbConnect();
  const product = await Product.findByIdAndDelete(id).lean();
  
  if (product && product.images && product.images.length > 0) {
    MediaService.deleteAssetsInBackground(product.images);
  }
  
  return product;
};
