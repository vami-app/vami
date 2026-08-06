import BlogForm from '@/features/admin/blog-form';
import { AdminPageFrame } from '@/components/templates/admin-page-frame';

export default function NewBlogPage() {
  return (
    <AdminPageFrame title="Create New Post">
      <BlogForm />
    </AdminPageFrame>
  );
}
