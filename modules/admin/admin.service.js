import { cacheTag, cacheLife } from 'next/cache';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';
import Category from '@/models/Category';

/**
 * Admin Module — Cross-domain Application Service
 *
 * Dashboard stats span multiple domains (products, blog, categories).
 * This is intentionally a cross-domain read — it lives in an "admin"
 * application module rather than any single domain module.
 *
 * Uses 'use cache' with a short TTL (5 minutes) so the dashboard shows
 * near-realtime counts without a DB hit on every render.
 * Revalidated by revalidateTag('stats') when any domain mutation occurs.
 */
export async function getDashboardStats() {
  'use cache';
  cacheTag('stats', 'products', 'blog', 'categories');
  // Short TTL — dashboard stats should update within minutes, not hours
  cacheLife({ revalidate: 300, expire: 600 }); // 5 min revalidate, 10 min expire

  await dbConnect();

  const [productCount, blogCount, categoryCount] = await Promise.all([
    Product.countDocuments(),
    BlogPost.countDocuments(),
    Category.countDocuments(),
  ]);

  return { productCount, blogCount, categoryCount };
}
