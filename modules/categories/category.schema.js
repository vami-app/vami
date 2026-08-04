import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  description: z.string().optional(),
  image: z.string().optional().or(z.literal('')),
  seoTitle: z.string().max(60, { message: 'SEO Title should be under 60 characters' }).optional(),
  seoDescription: z
    .string()
    .max(160, { message: 'SEO Description should be under 160 characters' })
    .optional(),
});
