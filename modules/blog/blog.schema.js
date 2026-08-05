import { z } from 'zod';

/**
 * Blog Module — Zod Schemas
 *
 * The BlogPostSchema here mirrors the one in lib/validations.js.
 * Both must be kept in sync. The lib/validations.js version is used
 * by API route handlers; this file is used within the blog module for
 * internal validation if needed.
 */
export const BlogPostSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  coverImage: z.string().optional().or(z.literal('')),
  // Triple projection content object (Lexical RTE)
  content: z.object({
    lexicalState: z.object({}).passthrough(),
    html: z.string().default(''),
    plainText: z.string().optional(),
  }),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  publishedAt: z.string().datetime().optional().or(z.literal('')),
});

