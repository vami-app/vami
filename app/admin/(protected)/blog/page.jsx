import BlogClient from './BlogClient';

export default function BlogPage() {
  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-text-primary">Blog Posts</h1>
          <p className="mt-2 text-sm text-text-secondary">
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
