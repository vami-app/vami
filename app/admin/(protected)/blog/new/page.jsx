import BlogForm from '../BlogForm';

export default function NewBlogPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-text-primary">Create New Post</h1>
      </div>
      <div className="bg-surface shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <BlogForm />
      </div>
    </div>
  );
}
