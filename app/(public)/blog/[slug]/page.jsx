import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { notFound } from 'next/navigation';
import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  await dbConnect();
  
  const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
  if (!post) return { title: 'Post Not Found' };
  
  return {
    title: post.seoTitle || `${post.title} | Smalloys Blog`,
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
  await dbConnect();
  
  const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
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
    <div className="bg-white px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mb-8">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to blog
        </Link>
        
        <div className="text-center">
          <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase">
            {post.tags && post.tags.join(', ')}
          </p>
          <h1 className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex justify-center items-center text-gray-500 text-sm">
            <Calendar className="h-4 w-4 mr-2" />
            <time dateTime={post.publishedAt?.toISOString()}>
              {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'N/A'}
            </time>
          </div>
        </div>
        
        {post.coverImage && (
          <div className="mt-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="w-full h-auto rounded-lg shadow-lg object-cover" src={post.coverImage} alt={post.title} />
          </div>
        )}

        <div className="mt-12 prose prose-blue prose-lg text-gray-500 mx-auto" dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </div>
  );
}
