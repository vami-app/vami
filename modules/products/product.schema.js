import { z } from 'zod';

/**
 * Products Module — Zod Schemas
 */
export const ProductSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  specs: z
    .array(z.object({ key: z.string().min(1), value: z.string().min(1) }))
    .optional()
    .default([]),
  variants: z
    .array(z.object({
      name: z.string().min(1),
      priceNote: z.string().optional(),
      images: z.array(z.string()).optional().default([]),
    }))
    .optional()
    .default([]),
  images: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});
