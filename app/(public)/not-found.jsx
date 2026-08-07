import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="layout-main min-h-[75vh] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-lg w-full">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-lg bg-surface-muted text-text-muted mb-8 shadow-sm border border-border-subtle">
          <SearchX className="h-10 w-10 opacity-70" strokeWidth={1.5} />
        </div>
        
        <h1 className="font-headline font-light text-5xl sm:text-7xl tracking-tighter text-text-primary mb-2">
          404
        </h1>
        
        <h2 className="text-xl sm:text-2xl font-medium text-text-primary mb-4 tracking-tight">
          Page not found
        </h2>
        
        <p className="text-text-muted mb-10 font-light leading-relaxed max-w-sm mx-auto">
          The resource you are looking for does not exist, has been moved, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-primary text-primary-foreground rounded-lg text-xs uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            Return to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-surface border border-border-base text-text-secondary rounded-lg text-xs uppercase tracking-wider font-semibold hover:bg-surface-muted transition-colors w-full sm:w-auto"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
