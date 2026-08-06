/**
 * sitemap.js — Next.js 16 native dynamic sitemap convention
 *
 * Generates a sitemap from live database content:
 *   - Static routes (home, products listing, blog listing)
 *   - Dynamic category pages
 *   - Dynamic product pages
 *   - Dynamic blog post pages
 *
 * Regenerated on every build + on-demand revalidation.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import dbConnect from '@/lib/db';
import Category from '@/models/Category';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://radheymetalalloysllp.com';

export default async function sitemap() {
  // ── Static routes ──────────────────────────────────────────────────────────
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/products`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
  ];

  // ── Dynamic routes (from DB) ───────────────────────────────────────────────
  let categoryRoutes = [];
  let productRoutes = [];
  let blogRoutes = [];

  try {
    await dbConnect();

    // Fetch all needed data directly to avoid pagination/cache issues
    const [categories, products, posts] = await Promise.all([
      Category.find({}).lean(),
      Product.find({ status: 'published' }).populate('category', 'slug').lean(),
      BlogPost.find({ status: 'published' }).lean(),
    ]);

    categoryRoutes = categories.map((cat) => ({
      url: `${BASE_URL}/products/${cat.slug}`,
      lastModified: new Date(cat.updatedAt || cat.createdAt),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    // Products are nested under category slugs
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
  } catch (error) {
    // Sitemap generation must not fail the build
    console.error(
      JSON.stringify({ level: 'error', service: 'vami', message: 'Sitemap generation error', error: error.message })
    );
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...blogRoutes];
}
