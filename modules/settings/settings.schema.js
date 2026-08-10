import { z } from 'zod';

const optionalUrl = z.string().url({ message: 'Invalid URL' }).optional().or(z.literal(''));

export const SiteSettingsSchema = z.object({
  siteName: z.string().min(1, { message: 'Site name is required' }).optional(),
  tagline: z.string().optional(),
  contactEmail: z.string().email({ message: 'Invalid email' }).optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  contactPhones: z.array(z.string()).optional(),
  contactPersons: z.array(z.string()).optional(),
  whatsappNumber: z.string().optional(),
  address: z.string().optional(),
  manufacturingAddress: z.string().optional(),
  mapsQuery: z.string().optional(),
  mapsEmbedUrl: z.string().optional(),
  linkedIn: optionalUrl,
  website: optionalUrl,
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  ogImageUrl: optionalUrl,
  faviconUrl: optionalUrl,
  youtubeVideoId: z.string().optional(),
  showProductImagesInList: z.boolean().optional(),
});
