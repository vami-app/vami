import Link from 'next/link';
import { ArrowLeft, Home, Package } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found — Smalloys',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 ease-out">
        {/* 404 Badge */}
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-black/5 border border-border-base text-xs font-semibold uppercase tracking-widest text-text-secondary mb-6">
          Error 404 &bull; Page Not Found
        </div>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-text-primary tracking-tight mb-4">
          Lost in the Foundry?
        </h1>

        {/* Subtitle */}
        <p className="text-base text-text-muted font-light max-w-md mx-auto mb-8 leading-relaxed">
          The page or product catalog item you are looking for doesn&apos;t exist or may have been moved to another specification.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-text-inverse text-sm font-medium hover:opacity-90 transition-all shadow-sm group"
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

        {/* Subtle Brand Footer */}
        <p className="mt-12 text-xs text-text-muted font-light">
          Smalloys Metallurgical Foundry &bull; Quality Copper & Alloy Engineering
        </p>
      </div>
    </div>
  );
}
