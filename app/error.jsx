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
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col justify-center items-center px-4 py-16">
      <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 ease-out">
        {/* Warning Icon Container */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 text-red-600 mb-6 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-gray-900 tracking-tight mb-3">
          Something went wrong
        </h1>

        {/* Description */}
        <p className="text-base text-gray-500 font-light max-w-md mx-auto mb-8 leading-relaxed">
          An unexpected system error occurred while processing your request. Please try refreshing or return to the main portal.
        </p>

        {/* Error Detail Pill (if message exists) */}
        {error?.message && (
          <div className="mb-8 p-4 bg-white border border-black/5 rounded-2xl text-left max-h-32 overflow-y-auto shadow-sm">
            <p className="text-xs font-mono text-gray-500 break-words">{error.message}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all shadow-sm group"
          >
            <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-black/10 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all shadow-sm"
          >
            <Home className="h-4 w-4 text-gray-400" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-gray-400 font-light">
          Smalloys Metallurgical Foundry &bull; System Error Handler
        </p>
      </div>
    </div>
  );
}
