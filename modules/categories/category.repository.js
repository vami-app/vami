/**
 * Categories Module — Repository Layer
 */
import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export const findAllCategories = async (limit = 0) => {
  await dbConnect();
  let query = Category.find({}).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  const categories = await query.lean();
  return serializeDocs(categories);
};

export const findCategoryBySlug = async (slug) => {
  await dbConnect();
  const category = await Category.findOne({ slug }).lean();
  return serializeDoc(category);
};

export const findCategoryById = async (id) => {
  await dbConnect();
  const category = await Category.findById(id).lean();
  return serializeDoc(category);
};

export const insertCategory = async (data) => {
  await dbConnect();
  const cat = await Category.create(data);
  return serializeDoc(cat.toObject ? cat.toObject() : cat);
};

export const patchCategory = async (id, data) => {
  await dbConnect();
  const cat = await Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  return serializeDoc(cat);
};

export const removeCategory = async (id) => {
  await dbConnect();
  const cat = await Category.findByIdAndDelete(id).lean();
  return serializeDoc(cat);
};
