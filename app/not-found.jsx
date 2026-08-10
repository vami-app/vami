import Link from 'next/link';
import { Home, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Page Not Found — Smalloys',
  description: 'The requested page could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 ease-out">
        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-lg bg-surface-subtle border border-border-base text-[10px] font-semibold uppercase tracking-widest text-text-secondary mb-6">
          Error 404 &bull; Page Not Found
        </div>

        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-text-primary tracking-tight mb-4">
          Lost in the Foundry?
        </h1>

        <p className="text-base text-text-muted font-light max-w-md mx-auto mb-8 leading-relaxed">
          The page or product catalog item you are looking for doesn&apos;t exist or may have been moved to another specification.
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
          Smalloys Metallurgical Foundry &bull; Quality Copper & Alloy Engineering
        </p>
      </div>
    </div>
  );
}
