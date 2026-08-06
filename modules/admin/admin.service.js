/**
 * Admin Module — Cross-domain Application Service
 *
 * Dashboard stats span multiple domains (products, blog, categories).
 * This is intentionally a cross-domain read — it lives in an "admin"
 * application module rather than any single domain module.
 *
 * Uses React's `cache()` for per-request deduplication in Server Components.
 * Not cached across requests (admin stats should always be live).
 * `connection()` opts into request-time rendering under Next.js cacheComponents.
 */
import { cache } from 'react';
import { connection } from 'next/server';
import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import BlogPost from '@/models/BlogPost';
import Category from '@/models/Category';

export const getDashboardStats = cache(async () => {
  await connection();
  await dbConnect();

  const [productCount, blogCount, categoryCount] = await Promise.all([
    Product.countDocuments(),
    BlogPost.countDocuments(),
    Category.countDocuments(),
  ]);

  return { productCount, blogCount, categoryCount };
});
