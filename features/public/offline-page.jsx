import Link from 'next/link';
import { WifiOff, Home, Package } from 'lucide-react';

export function OfflinePageFeature() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-surface-muted border border-border-base mb-8">
          <WifiOff className="w-9 h-9 text-text-muted" aria-hidden="true" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-black/5 border border-border-base text-xs font-semibold uppercase tracking-widest text-text-secondary mb-6">
          No internet connection
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-text-primary tracking-tight mb-4">
          You&apos;re offline
        </h1>

        {/* Description */}
        <p className="text-base text-text-muted font-light max-w-md mx-auto mb-8 leading-relaxed">
          It looks like you&apos;ve lost your internet connection. Pages you&apos;ve visited
          recently may still be available. Try again when you&apos;re back online.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-text-inverse text-sm font-medium hover:opacity-90 transition-all shadow-sm"
          >
            <Home className="h-4 w-4" />
            <span>Return to Homepage</span>
          </Link>
          <Link
            href="/products"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border-base bg-surface text-text-secondary text-sm font-medium hover:bg-surface-muted transition-all shadow-sm"
          >
            <Package className="h-4 w-4 text-text-muted" />
            <span>Browse Products</span>
          </Link>
        </div>

        {/* Subtle footer */}
        <p className="mt-12 text-xs text-text-muted font-light">
          Radhey Metal Alloys LLP &bull; Copper, Brass &amp; Phosphor Bronze Manufacturer
        </p>
      </div>
    </div>
  );
}
