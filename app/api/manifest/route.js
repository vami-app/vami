import { pwaConfig } from '@/modules/pwa/pwa.config.js';

export function GET() {
  return Response.json({
    id: pwaConfig.id,
    name: pwaConfig.name,
    short_name: pwaConfig.shortName,
    description: pwaConfig.description,
    start_url: pwaConfig.startUrl,
    scope: pwaConfig.scope,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    background_color: pwaConfig.backgroundColor,
    theme_color: pwaConfig.themeColor.light,
    lang: 'en',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    prefer_related_applications: false,

    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],

    shortcuts: pwaConfig.shortcuts.map((s) => ({
      name: s.name,
      url: s.url,
      description: s.description,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    })),

    screenshots: [
      {
        src: '/icons/screenshot-narrow.png',
        sizes: '1080x1920',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Radhey Metal Alloys — Mobile view',
      },
      {
        src: '/icons/screenshot-wide.png',
        sizes: '1920x1080',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Radhey Metal Alloys — Desktop view',
      },
    ],
  });
}
