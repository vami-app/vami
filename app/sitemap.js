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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://smalloys.com';

export default async function sitemap() {
  await dbConnect();

  // Lazy imports to avoid loading modules before DB is ready
  const [
    { getAllCategories } = {},
    { getAllPublishedProducts } = {},
    { getPublishedBlogPosts } = {},
  ] = await Promise.all([
    import('@/modules/categories'),
    import('@/modules/products'),
    import('@/modules/blog'),
  ]);

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
    const [categories, products, posts] = await Promise.all([
      getAllCategories(),
      getAllPublishedProducts(),
      getPublishedBlogPosts(),
    ]);

    categoryRoutes = categories.map((cat) => ({
      url: `${BASE_URL}/products/${cat.slug}`,
      lastModified: new Date(cat.updatedAt || cat.createdAt),
      changeFrequency: 'monthly',
      priority: 0.8,
    }));

    // Products are nested under category slugs
    productRoutes = products
      .filter((p) => p.category?.slug)
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
