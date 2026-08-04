'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('Admin Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-surface rounded-[var(--outer-radius)] border border-border-base p-8">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 text-red-500 mb-6 shadow-sm border border-red-100">
        <AlertTriangle className="h-8 w-8" />
      </div>
      
      <h2 className="font-headline font-light text-2xl text-text-primary mb-4">
        Dashboard Module Failed
      </h2>
      
      <p className="text-text-muted mb-8 font-light text-center max-w-md">
        {error.message || 'An error occurred while loading this admin module.'}
      </p>
      
      <button
        onClick={() => reset()}
        className="inline-flex items-center justify-center px-6 py-2.5 bg-black text-white rounded-full font-medium hover:opacity-90 transition-opacity"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Module
      </button>
    </div>
  );
}
