/**
 * Categories Module — Repository Layer
 */
import dbConnect from '@/lib/db';
import Category from '@/models/Category';

export const findAllCategories = async (limit = 0) => {
  await dbConnect();
  let query = Category.find({}).sort({ createdAt: -1 });
  if (limit) query = query.limit(limit);
  return query.lean();
};

export const findCategoryBySlug = async (slug) => {
  await dbConnect();
  return Category.findOne({ slug }).lean();
};

export const findCategoryById = async (id) => {
  await dbConnect();
  return Category.findById(id).lean();
};

export const insertCategory = async (data) => {
  await dbConnect();
  return Category.create(data);
};

export const patchCategory = async (id, data) => {
  await dbConnect();
  return Category.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
};

export const removeCategory = async (id) => {
  await dbConnect();
  return Category.findByIdAndDelete(id).lean();
};
