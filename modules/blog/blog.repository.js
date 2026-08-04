/**
 * Blog Module — Repository Layer
 *
 * Pure data access: all Mongoose queries for the blog domain live here.
 * Services call these functions — they contain no business logic.
 * Changing the ORM or adding caching touches only this file.
 */
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

export const findPublishedPosts = async () => {
  await dbConnect();
  return BlogPost.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
};

export const findPostBySlug = async (slug) => {
  await dbConnect();
  return BlogPost.findOne({ slug, status: 'published' }).lean();
};

export const findAllPosts = async () => {
  await dbConnect();
  return BlogPost.find({}).sort({ createdAt: -1 }).lean();
};

export const findPostById = async (id) => {
  await dbConnect();
  return BlogPost.findById(id).lean();
};

export const insertPost = async (data) => {
  await dbConnect();
  return BlogPost.create(data);
};

export const patchPost = async (id, data) => {
  await dbConnect();
  return BlogPost.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
};

export const removePost = async (id) => {
  await dbConnect();
  return BlogPost.findByIdAndDelete(id).lean();
};
