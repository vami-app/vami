/**
 * sitemap.js — Next.js 16 native dynamic sitemap convention
 */

import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';
import LandingPage from '@/models/LandingPage';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://radheymetalalloysllp.com';

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/capabilities`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/quality`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/industries`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/resources`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/certificates`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];

  let categoryRoutes = [];
  let productRoutes = [];
  let blogRoutes = [];
  let landingRoutes = [];

  try {
    await dbConnect();

    const [categories, products, posts, landings] = await Promise.all([
      Category.find({}).lean(),
      Product.find({ status: 'published' }).populate('category', 'slug').lean(),
      BlogPost.find({ status: 'published' }).lean(),
      LandingPage.find({ status: 'published' }).lean(),
    ]);

    categoryRoutes = categories.map((cat) => ({
      url: `${BASE_URL}/products/${cat.slug}`,
      lastModified: new Date(cat.updatedAt || cat.createdAt),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    productRoutes = products
      .filter((p) => p.category && p.category.slug)
      .map((product) => ({
        url: `${BASE_URL}/products/${product.category.slug}/${product.slug}`,
        lastModified: new Date(product.updatedAt || product.createdAt),
        changeFrequency: 'monthly',
        priority: 0.7,
      }));

    blogRoutes = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.publishedAt || post.createdAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));

    landingRoutes = landings.map((page) => ({
      url: `${BASE_URL}/applications/${page.slug}`,
      lastModified: new Date(page.updatedAt || page.createdAt),
      changeFrequency: 'monthly',
      priority: 0.6,
    }));
  } catch (error) {
    console.error(
      JSON.stringify({ level: 'error', service: 'rma', message: 'Sitemap generation error', error: error.message })
    );
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes, ...landingRoutes];
}
