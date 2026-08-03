import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Journal | Smalloys Technical Insights',
  description: 'Deep dives into metallurgy, copper casting, and CNC machining from the engineers at Smalloys.',
};

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
    <div className="layout-main bg-[#f9f9f9]">
      {/* Hero Section */}
      <section className="pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-20 w-full bg-white border-b border-black/5">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          <div className="max-w-3xl">
            <span className="text-xs font-semibold text-gray-500 tracking-[0.2em] uppercase">Industry Insights</span>
            <h1 className="font-headline font-light text-gray-900 mt-6 leading-tight text-5xl sm:text-6xl lg:text-7xl text-balance">
              The Metallurgy Journal.
            </h1>
            <p className="mt-6 text-gray-500 text-lg sm:text-xl font-light leading-relaxed max-w-2xl">
              Deep technical explorations into the science of high-conductivity copper, marine grade bronze, and precision CNC machining.
            </p>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-16 sm:py-24 w-full">
        <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
          {posts.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-gray-300 rounded-[var(--outer-radius)] bg-white">
              <h3 className="text-lg font-medium text-gray-900">No articles published yet</h3>
              <p className="mt-2 text-gray-500 font-light">Check back soon for deep dives into material science.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              {posts.map((post) => (
                <Link 
                  key={post._id.toString()} 
                  href={`/blog/${post.slug}`}
                  className="flex flex-col bg-white rounded-[calc(var(--outer-radius)-8px)] shadow-sm border border-black/5 overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
                >
                  {post.coverImage ? (
                    <div className="relative w-full aspect-video overflow-hidden bg-gray-100 border-b border-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        src={post.coverImage} 
                        alt={post.title} 
                      />
                    </div>
                  ) : (
                    <div className="relative w-full aspect-video bg-gray-50 border-b border-black/5 flex items-center justify-center overflow-hidden">
                      <span className="text-gray-300 font-headline italic text-3xl opacity-50 transform -rotate-12">Smalloys</span>
                    </div>
                  )}
                  
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
                    <div>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, idx) => (
                            <span key={idx} className="inline-block px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 tracking-wide">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h3 className="text-xl sm:text-2xl font-headline font-light text-gray-900 leading-snug group-hover:text-black transition-colors">
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p className="mt-4 text-sm sm:text-base text-gray-500 font-light leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center text-xs font-medium text-gray-400 tracking-wide uppercase">
                        <Calendar className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                        <time dateTime={post.publishedAt?.toISOString()}>
                          {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </time>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
