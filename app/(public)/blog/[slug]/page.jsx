import { getBlogPostBySlug } from '@/services/blog.service';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.seoTitle || `${post.title} | Smalloys Journal`,
    description: post.seoDescription || post.excerpt || `Read ${post.title} on the Smalloys blog.`,
    openGraph: {
      images: post.coverImage ? [post.coverImage] : [],
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    image: post.coverImage ? [post.coverImage] : [],
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    description: post.seoDescription || post.excerpt,
    author: {
      '@type': 'Organization',
      name: 'Smalloys',
      url: 'https://smalloys.com'
    }
  };

  return (
    <div className="layout-main min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Article Header Section */}
      <section className="pt-8 pb-12 sm:pt-16 sm:pb-16 w-full">
        <div className="w-full max-w-3xl mx-auto px-[var(--gap)]">
          <Link href="/blog" className="inline-flex items-center text-xs font-semibold tracking-[0.2em] uppercase text-text-muted hover:text-text-primary transition-colors mb-10 sm:mb-16">
            <ArrowLeft className="h-4 w-4 mr-2 flex-shrink-0" /> Back to Journal
          </Link>
          
          <div className="mb-10">
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, idx) => (
                  <span key={idx} className="inline-block px-3 py-1 rounded-full bg-surface border border-border-base text-xs font-medium text-text-secondary tracking-wide">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <h1 className="font-headline font-light text-text-primary leading-tight text-4xl sm:text-5xl lg:text-6xl text-balance">
              {post.title}
            </h1>
            
            <div className="mt-8 flex items-center text-sm text-text-muted font-light border-t border-border-subtle pt-6">
              <div className="flex items-center mr-6">
                <span className="font-medium text-text-primary mr-2">Smalloys Engineering</span>
              </div>
              <div className="flex items-center text-text-muted">
                <Calendar className="h-4 w-4 mr-2" strokeWidth={1.5} />
                <time dateTime={post.publishedAt?.toISOString()}>
                  {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </time>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Cover Image Section */}
      {post.coverImage && (
        <section className="w-full mb-12 sm:mb-20">
          <div className="w-full max-w-[var(--max-width-layout)] mx-auto px-[var(--gap)]">
            <div className="w-full aspect-video lg:aspect-[21/9] rounded-[var(--outer-radius)] overflow-hidden border border-border-subtle shadow-sm relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                className="absolute inset-0 w-full h-full object-cover" 
                src={post.coverImage} 
                alt={post.title} 
              />
            </div>
          </div>
        </section>
      )}

      {/* Article Content Section */}
      <section className="pb-24 sm:pb-32 w-full">
        <div className="w-full max-w-3xl mx-auto px-[var(--gap)]">
          <article 
            className="prose prose-blue mx-auto bg-surface p-8 sm:p-12 lg:p-16 rounded-[var(--outer-radius)] shadow-sm border border-border-subtle"
            dangerouslySetInnerHTML={{ __html: post.content }} 
          />
        </div>
      </section>
    </div>
  );
}
