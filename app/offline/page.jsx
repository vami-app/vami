/**
 * app/offline/page.jsx — Offline fallback page
 *
 * Deliberately outside app/(public)/ because PublicLayout hits MongoDB for
 * the category nav, which fails during Docker builds (SKIP_ENV_VALIDATION=1,
 * no DB available). This page must be zero-dependency and always prerenderable.
 *
 * The service worker precaches this URL and serves it for offline navigations.
 */

import Link from 'next/link';
import { WifiOff, Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'You are offline — Radhey Metal Alloys LLP',
  description: 'No internet connection. Please check your network and try again.',
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center">

        <div className="inline-flex items-center justify-center w-20 h-20 rounded-lg bg-surface-muted border border-border-base mb-8">
          <WifiOff className="w-9 h-9 text-text-muted" aria-hidden="true" />
        </div>

        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-surface-subtle border border-border-base text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-6">
          No internet connection
        </div>

        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-text-primary tracking-tight mb-4">
          You&apos;re offline
        </h1>

        <p className="text-base text-text-muted font-light max-w-md mx-auto mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Pages you&apos;ve visited
          recently may still be available. Try again when you&apos;re back online.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button asChild className="w-full sm:w-auto py-3 shadow-sm">
            <Link href="/">
              <Home className="h-4 w-4" />
              <span>Return to Homepage</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto py-3 border-border-base bg-surface text-text-secondary hover:bg-surface-muted hover:text-text-secondary hover:border-border-base shadow-sm">
            <Link href="/products">
              <Package className="h-4 w-4 text-text-muted" />
              <span>Browse Products</span>
            </Link>
          </Button>
        </div>

        <p className="mt-12 text-xs text-text-muted font-light">
          Radhey Metal Alloys LLP &bull; Copper, Brass &amp; Phosphor Bronze Manufacturer
        </p>
      </div>
    </div>
  );
}
