'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Public Layout Error:', error);
  }, [error]);

  return (
    <div className="layout-main min-h-[70vh] flex items-center justify-center py-16 px-4">
      <div className="text-center max-w-lg w-full">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-6 shadow-sm border border-red-100">
          <AlertTriangle className="h-8 w-8" />
        </div>
        
        <h2 className="font-headline font-light text-3xl sm:text-4xl text-text-primary mb-4">
          Something went wrong
        </h2>
        
        <p className="text-text-muted mb-8 font-light leading-relaxed">
          {error.message || 'We encountered an unexpected error while loading this page. The application has isolated the failure.'}
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-6 py-3 bg-text-primary text-background rounded-full font-medium hover:opacity-90 transition-opacity w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try again
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-surface border border-border-base text-text-primary rounded-full font-medium hover:bg-surface-muted transition-colors w-full sm:w-auto"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
