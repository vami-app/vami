import { z } from 'zod';

/**
 * Blog Module — Zod Schemas
 */
export const BlogPostSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  coverImage: z.string().optional().or(z.literal('')),
  content: z.string().min(1, { message: 'Content is required' }),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  publishedAt: z.string().datetime().optional().or(z.literal('')),
});
