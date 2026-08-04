/**
 * Blog Module — Repository Layer
 *
 * Pure data access: all Mongoose queries for the blog domain live here.
 * Services call these functions — they contain no business logic.
 * Changing the ORM or adding caching touches only this file.
 */
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { serializeDoc, serializeDocs } from '@/lib/serialize';

export const findPublishedPosts = async () => {
  await dbConnect();
  const posts = await BlogPost.find({ status: 'published' })
    .sort({ publishedAt: -1, createdAt: -1 })
    .lean();
  return serializeDocs(posts);
};

export const findPostBySlug = async (slug) => {
  await dbConnect();
  const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
  return serializeDoc(post);
};

export const findAllPosts = async () => {
  await dbConnect();
  const posts = await BlogPost.find({}).sort({ createdAt: -1 }).lean();
  return serializeDocs(posts);
};

export const findPostById = async (id) => {
  await dbConnect();
  const post = await BlogPost.findById(id).lean();
  return serializeDoc(post);
};

export const insertPost = async (data) => {
  await dbConnect();
  const post = await BlogPost.create(data);
  return serializeDoc(post.toObject ? post.toObject() : post);
};

export const patchPost = async (id, data) => {
  await dbConnect();
  const post = await BlogPost.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();
  return serializeDoc(post);
};

export const removePost = async (id) => {
  await dbConnect();
  const post = await BlogPost.findByIdAndDelete(id).lean();
  return serializeDoc(post);
};
