import { getBlogPostBySlug } from '@/modules/blog';
import { BlogPostPageFeature } from '@/features/public/blog/blog-post-page';
import { notFound } from 'next/navigation';

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

  return <BlogPostPageFeature post={post} jsonLd={jsonLd} />;
}
