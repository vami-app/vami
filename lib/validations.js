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
});

export const BlogPostSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  slug: z.string().min(1, { message: 'Slug is required' }),
  coverImage: z.string().optional().or(z.literal('')),
  // ─── Lexical RTE content (triple projection) ───────────────────────────
  // The client sends { lexicalState, html }. Server adds plainText projection.
  content: z.object({
    lexicalState: z.object({}).passthrough(), // Accept any valid Lexical JSON object
    html: z.string().default(''),
    // plainText is computed server-side — clients must not send it
    plainText: z.string().optional(),
  }),
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
