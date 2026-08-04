import { z } from 'zod';

export const SiteSettingsSchema = z.object({
  siteName: z.string().min(1, { message: 'Site name is required' }).optional(),
  tagline: z.string().optional(),
  contactEmail: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  linkedIn: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  website: z.string().url({ message: 'Invalid URL' }).optional().or(z.literal('')),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
});
