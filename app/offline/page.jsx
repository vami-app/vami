/**
 * app/offline/page.jsx — Offline fallback page
 *
 * Deliberately outside app/(public)/ because PublicLayout hits MongoDB for
 * the category nav, which fails during Docker builds (SKIP_ENV_VALIDATION=1,
 * no DB available). This page must be zero-dependency and always prerenderable.
 *
 * The service worker precaches this URL and serves it for offline navigations.
 */

import { OfflinePageFeature } from '@/features/public/offline-page';

export const metadata = {
  title: 'You are offline — Radhey Metal Alloys LLP',
  description: 'No internet connection. Please check your network and try again.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflinePageFeature />;
}
