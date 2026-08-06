/**
 * robots.js — Next.js 16 native robots.txt convention
 *
 * Disallows all admin routes from search engine indexing.
 * Allows all public routes.
 * Includes sitemap reference for discovery.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

import { getBaseUrl } from '@/modules/pwa/pwa.config.js';

export default function robots() {
  const baseUrl = getBaseUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/offline'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
