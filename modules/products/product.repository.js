/**
 * Products Module — Repository Layer
 * Pure Mongoose queries for the products domain. No business logic.
 */
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import Category from '@/models/Category';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export const findPublishedProducts = async () => {
  await dbConnect();
  const products = await Product.find({ status: 'published' })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .lean();
  return serializeDocs(products);
};

export const findFeaturedProducts = async (limit = 4) => {
  await dbConnect();
  const products = await Product.find({ status: 'published', featured: true })
    .populate('category', 'name slug')
    .limit(limit)
    .lean();
  return serializeDocs(products);
};

export const findProductsByCategory = async (categoryId) => {
  await dbConnect();
  const products = await Product.find({ category: categoryId, status: 'published' }).lean();
  return serializeDocs(products);
};

export const findProductBySlug = async (categorySlug, productSlug) => {
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
};

export const findProductById = async (id) => {
  await dbConnect();
  const product = await Product.findById(id).populate('category', 'name slug').lean();
  return serializeDoc(product);
};

export const findProductsPaginated = async ({ categoryId = null, page = 1, limit = 20 } = {}) => {
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
    products: serializeDocs(products),
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

export const insertProduct = async (data) => {
  await dbConnect();
  const product = await Product.create(data);
  return serializeDoc(product.toObject ? product.toObject() : product);
};

export const patchProduct = async (id, data) => {
  await dbConnect();
  const product = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  return serializeDoc(product);
};

export const removeProduct = async (id) => {
  await dbConnect();
  const product = await Product.findByIdAndDelete(id).lean();
  return serializeDoc(product);
};
