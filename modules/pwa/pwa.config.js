/**
 * modules/pwa/pwa.config.js
 *
 * Single source of truth for all PWA identity.
 * Manifest, icon generator, SW cache strategies, and client UI all read from here.
 * Rebranding = one-file change.
 */

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  if (process.env.NODE_ENV === 'development') return 'http://localhost:3000';
  return 'https://radheymetalalloysllp.com';
};

const BASE_URL = getBaseUrl();

export const pwaConfig = {
  name: 'Radhey Metal Alloys LLP',
  shortName: 'Radhey Alloys', // ≤12 chars for home-screen labels
  description:
    'Radhey Metal Alloys LLP manufactures NABL certified Copper, Brass & Phosphor Bronze sheets, plates, circles, ingots, and custom castings. Certified Company TC & Ultrasonic reports provided.',
  /**
   * id must be stable — Chrome keys the installed PWA identity on this.
   * Changing it post-release orphans existing installs.
   */
  id: `${BASE_URL}/`,
  startUrl: '/?utm_source=pwa',
  scope: '/',
  themeColor: {
    light: '#f9f9f9', // --background light from globals.css
    dark: '#000000',  // --background dark from globals.css
  },
  backgroundColor: '#f9f9f9',
  icons: {
    source: 'public/images/logo.png', // 3907×3133 — verified large enough
    outDir: 'public/icons',
    sizes: [192, 512],
  },
  shortcuts: [
    {
      name: 'Products',
      url: '/products',
      description: 'Browse our metal alloy catalog',
    },
    {
      name: 'Blog',
      url: '/blog',
      description: 'Industry news and insights',
    },
    {
      name: 'Contact',
      url: '/contact',
      description: 'Get a custom technical quote',
    },
  ],
};
