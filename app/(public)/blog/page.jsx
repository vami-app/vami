import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default async function BlogListingPage() {
  let posts = [];
  try {
    await dbConnect();
    const postDocs = await BlogPost.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .lean();
    posts = postDocs.map(post => ({
      ...post,
      _id: post._id.toString()
    }));
  } catch (error) {
    console.error('Database connection failed on Blog page render:', error.message);
  }

  return (
    <div className="bg-white pt-16 pb-20 px-4 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
      <div className="relative max-w-lg mx-auto divide-y-2 divide-gray-200 lg:max-w-7xl">
        <div>
          <h2 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
            Industry Insights & News
          </h2>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Discover the latest updates, material science breakthroughs, and company news from Smalloys.
          </p>
        </div>
        <div className="mt-12 grid gap-16 pt-12 lg:grid-cols-3 lg:gap-x-5 lg:gap-y-12">
          {posts.map((post) => (
            <div key={post._id.toString()} className="flex flex-col rounded-lg shadow-lg overflow-hidden border border-gray-100 transition-transform hover:-translate-y-1 duration-300">
              {post.coverImage && (
                <div className="flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="h-48 w-full object-cover" src={post.coverImage} alt="" />
                </div>
              )}
              <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-600 flex space-x-2">
                    {post.tags && post.tags.map((tag, idx) => (
                      <span key={idx} className="hover:underline">{tag}</span>
                    ))}
                  </p>
                  <Link href={`/blog/${post.slug}`} className="block mt-2">
                    <p className="text-xl font-semibold text-gray-900">{post.title}</p>
                    <p className="mt-3 text-base text-gray-500 line-clamp-3">{post.excerpt}</p>
                  </Link>
                </div>
                <div className="mt-6 flex items-center">
                  <div className="flex space-x-1 text-sm text-gray-500 items-center">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={post.publishedAt?.toISOString()}>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
                    </time>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {posts.length === 0 && (
          <div className="mt-12 text-center text-gray-500 pt-12">
            No blog posts published yet.
          </div>
        )}
      </div>
    </div>
  );
}
