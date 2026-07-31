import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  seoTitle: z.string().max(60, 'SEO Title should be under 60 characters').optional(),
  seoDescription: z.string().max(160, 'SEO Description should be under 160 characters').optional(),
});

export const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  category: z.string().min(1, 'Category is required'),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  specs: z.array(z.object({
    key: z.string().min(1),
    value: z.string().min(1),
  })).optional().default([]),
  variants: z.array(z.object({
    name: z.string().min(1),
    priceNote: z.string().optional(),
    images: z.array(z.string().url()).optional().default([]),
  })).optional().default([]),
  images: z.array(z.string().url()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});

export const BlogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  coverImage: z.string().url().optional().or(z.literal('')),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  publishedAt: z.string().datetime().optional().or(z.literal('')),
});
