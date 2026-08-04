import BlogForm from '../../BlogForm';
import { getBlogPostById } from '@/services/blog.service';
import { notFound } from 'next/navigation';

export default async function EditBlogPage({ params }) {
  const { id } = await params;
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    notFound();
  }

  const rawPost = await getBlogPostById(id);
  if (!rawPost) {
    notFound();
  }
  const post = JSON.parse(JSON.stringify(rawPost));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Edit Post: {post.title}</h1>
      </div>
      <div className="bg-surface shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <BlogForm initialData={post} />
      </div>
    </div>
  );
}
