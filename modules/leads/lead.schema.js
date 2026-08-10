import { z } from 'zod';

export const LeadCreateSchema = z.object({
  name: z.string().max(120).optional().default(''),
  company: z.string().min(1, { message: 'Company is required' }).max(200),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(5, { message: 'Phone is required' }).max(40),
  country: z.string().max(100).optional().default(''),
  product: z.string().max(200).optional().default(''),
  category: z.string().max(120).optional().default(''),
  materialGrade: z.string().max(200).optional().default(''),
  formFactor: z.string().max(120).optional().default(''),
  quantity: z.string().max(120).optional().default(''),
  dimensions: z.string().max(300).optional().default(''),
  requiredStandard: z.string().max(200).optional().default(''),
  deliveryLocation: z.string().max(200).optional().default(''),
  additionalRequirements: z.string().max(5000).optional().default(''),
  needsTC: z.boolean().optional().default(false),
  needsNabl: z.boolean().optional().default(false),
  needsUT: z.boolean().optional().default(false),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string().optional().default(''),
        mimeType: z.string().optional().default(''),
        bytes: z.number().optional(),
      })
    )
    .max(5)
    .optional()
    .default([]),
  source: z.string().optional().default('contact'),
  /** Honeypot — checked in route handler */
  website: z.string().optional().default(''),
});

export const LeadUpdateSchema = z.object({
  status: z.enum(['new', 'reviewing', 'quoted', 'closed', 'spam']).optional(),
  internalNotes: z.string().max(10000).optional(),
  quotationNotes: z.string().max(10000).optional(),
  quotationFileUrl: z.string().optional(),
  quotationValidity: z.string().max(200).optional(),
});

export const CertificateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  issuedBy: z.string().optional().default(''),
  issuedAt: z.string().optional().or(z.literal('')),
  fileUrl: z.string().optional().default(''),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  verifiedAt: z.string().optional().or(z.literal('')),
});

export const ResourceSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['catalogue', 'tds', 'company_profile', 'other']).optional().default('other'),
  description: z.string().optional().default(''),
  fileUrl: z.string().optional().default(''),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});

export const PageContentSchema = z.object({
  key: z.enum(['capabilities', 'quality', 'industries', 'why_rma', 'home_gallery']),
  title: z.string().optional().default(''),
  subtitle: z.string().optional().default(''),
  body: z.string().optional().default(''),
  sections: z
    .array(
      z.object({
        title: z.string().optional().default(''),
        description: z.string().optional().default(''),
        imageUrl: z.string().optional().default(''),
        order: z.number().optional().default(0),
      })
    )
    .optional()
    .default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
});
