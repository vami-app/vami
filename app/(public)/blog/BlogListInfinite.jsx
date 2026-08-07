'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ArrowRight } from 'lucide-react';
import { loadMoreBlogPosts } from '@/modules/blog/blog.actions';
import LoadMore from '@/components/ui/LoadMore';
import toast from 'react-hot-toast';

export default function BlogListInfinite({ initialEdges, initialPageInfo }) {
  const [edges, setEdges] = useState(initialEdges);
  const [pageInfo, setPageInfo] = useState(initialPageInfo);
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadMore = async () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor || isLoading) return;
    setIsLoading(true);

    try {
      const data = await loadMoreBlogPosts(pageInfo.endCursor);
      setEdges((prev) => [...prev, ...data.edges]);
      setPageInfo(data.pageInfo);
    } catch (error) {
      toast.error('Failed to load more posts.');
    } finally {
      setIsLoading(false);
    }
  };

  if (edges.length === 0) {
    return (
      <div className="text-center py-24 border border-dashed border-border-base rounded-[var(--outer-radius)] bg-surface">
        <h3 className="text-lg font-medium text-text-primary">No articles published yet</h3>
        <p className="mt-2 text-text-muted font-light">Check back soon for deep dives into material science.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
        {edges.map(({ node: post }) => (
          <Link 
            key={post._id.toString()} 
            href={`/blog/${post.slug}`}
            className="flex flex-col bg-surface rounded-[calc(var(--outer-radius)-8px)] shadow-sm border border-border-subtle overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 group"
          >
            {post.coverImage ? (
              <div className="relative w-full aspect-video overflow-hidden bg-surface-subtle border-b border-border-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  src={post.coverImage} 
                  alt={post.title} 
                />
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-surface-muted border-b border-border-subtle flex items-center justify-center overflow-hidden">
                <span className="text-text-muted font-headline italic text-3xl opacity-50 transform -rotate-12">Smalloys</span>
              </div>
            )}
            
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
              <div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map((tag, idx) => (
                      <span key={idx} className="inline-block px-3 py-1 rounded-lg bg-surface-muted border border-border-subtle text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <h3 className="text-xl sm:text-2xl font-headline font-light text-text-primary leading-snug group-hover:text-text-primary transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="mt-4 text-sm sm:text-base text-text-muted font-light leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
              </div>
              
              <div className="mt-8 pt-6 border-t border-surface-subtle flex items-center justify-between">
                <div className="flex items-center text-xs font-medium text-text-muted tracking-wide uppercase">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" strokeWidth={2} />
                  <time dateTime={post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </time>
                </div>
                <ArrowRight className="h-4 w-4 text-text-muted group-hover:text-text-primary transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
      <LoadMore onLoadMore={handleLoadMore} hasNext={pageInfo.hasNextPage} isLoading={isLoading} />
    </>
  );
}
