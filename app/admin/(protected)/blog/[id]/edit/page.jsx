import BlogForm from '../../BlogForm';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { notFound } from 'next/navigation';

export default async function EditBlogPage({ params }) {
  const { id } = await params;
  await dbConnect();
  
  const post = await BlogPost.findById(id).lean();
  if (!post) {
    notFound();
  }

  // Convert ObjectIds and Dates to strings for Client Component
  post._id = post._id.toString();
  post.createdAt = post.createdAt.toISOString();
  post.updatedAt = post.updatedAt.toISOString();
  if (post.publishedAt) {
    post.publishedAt = post.publishedAt.toISOString();
  }

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
