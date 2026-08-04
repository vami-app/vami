/**
 * robots.js — Next.js 16 native robots.txt convention
 *
 * Disallows all admin routes from search engine indexing.
 * Allows all public routes.
 * Includes sitemap reference for discovery.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://smalloys.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
