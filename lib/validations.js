import { z } from 'zod';

// ─── Shared Primitives ───────────────────────────────────────────────────────

/**
 * MongoDB ObjectId validator — prevents CastError when malformed IDs
 * reach Mongoose before being validated. Use in all [id] route handlers.
 */
export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid resource ID format' });

// ─── Domain Schemas (Zod v4 API) ─────────────────────────────────────────────
// Breaking changes from v3 → v4:
//   - Error object: use .issues (was .errors)
//   - Use z.string().min(1) etc. — method chaining still valid in v4
//   - z.ZodError.flatten() replaces .format() for structured output

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

export const ProductSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  shortDescription: z.string().optional(),
  longDescription: z.string().optional(),
  specs: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional()
    .default([]),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),
        priceNote: z.string().optional(),
        images: z.array(z.string()).optional().default([]),
      })
    )
    .optional()
    .default([]),
  images: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  grades: z.array(z.string()).optional().default([]),
  thicknessRange: z.string().optional().default(''),
  widthRange: z.string().optional().default(''),
  lengthRange: z.string().optional().default(''),
  temper: z.string().optional().default(''),
  surfaceFinish: z.string().optional().default(''),
  standards: z.array(z.string()).optional().default([]),
  applications: z.array(z.string()).optional().default([]),
  availableForms: z.array(z.string()).optional().default([]),
  qualityDocs: z.array(z.string()).optional().default([]),
});

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

/**
 * Formats Zod v4 validation issues into a structured response body.
 * Use this in all route handlers instead of parsed.error.format().
 *
 * @param {import('zod').ZodError} zodError
 * @returns {{ field: string, message: string }[]}
 */
export function formatZodIssues(zodError) {
  return zodError.issues.map((issue) => ({
    field: issue.path.join('.') || 'root',
    message: issue.message,
  }));
}
