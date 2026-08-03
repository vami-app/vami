'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to console or error reporting service
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 ease-out">
        {/* Warning Icon Container */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 text-red-600 mb-6 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-text-primary tracking-tight mb-3">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-base text-text-muted font-light max-w-md mx-auto mb-8 leading-relaxed">
          An unexpected system error occurred while processing your request. Please try refreshing or return to the main portal.
        </p>

        {/* Error Detail Pill (if message exists) */}
        {error?.message && (
          <div className="mb-8 p-4 bg-surface border border-border-subtle rounded-2xl text-left max-h-32 overflow-y-auto shadow-sm">
            <p className="text-xs font-mono text-text-muted break-words">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-text-primary text-text-inverse text-sm font-medium hover:opacity-90 transition-all shadow-sm group"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border-base bg-surface text-text-secondary text-sm font-medium hover:bg-surface-muted transition-all shadow-sm"
          >
            <Home className="h-4 w-4 text-text-muted" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-text-muted font-light">
          Smalloys Metallurgical Foundry &bull; System Error Handler
        </p>
      </div>
    </div>
  );
}
