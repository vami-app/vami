import BlogForm from '../../BlogForm';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import mongoose from 'mongoose';
import { notFound } from 'next/navigation';

export default async function EditBlogPage({ params }) {
  const { id } = await params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    notFound();
  }

  await dbConnect();
  
  const rawPost = await BlogPost.findById(id).lean();
  if (!rawPost) {
    notFound();
  }
  const post = JSON.parse(JSON.stringify(rawPost));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Edit Post: {post.title}</h1>
      </div>
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <BlogForm initialData={post} />
      </div>
    </div>
  );
}
