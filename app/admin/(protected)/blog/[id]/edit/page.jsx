import BlogForm from '@/features/admin/blog-form';
import { AdminPageFrame } from '@/components/templates/admin-page-frame';
import { getBlogPostById } from '@/modules/blog';
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
    <AdminPageFrame title={`Edit Post: ${post.title}`}>
      <BlogForm initialData={post} />
    </AdminPageFrame>
  );
}
