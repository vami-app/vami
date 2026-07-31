import BlogClient from './BlogClient';

export default function BlogPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Blog Posts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your SEO-optimized blog content.
          </p>
        </div>
      </div>
      <div className="mt-8">
        <BlogClient />
      </div>
    </div>
  );
}
