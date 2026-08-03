'use client';

import { useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Critical Global Error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#f9f9f9] text-gray-900 min-h-screen flex flex-col justify-center items-center px-4 py-16 font-sans antialiased">
        <div className="w-full max-w-lg text-center animate-in fade-in zoom-in-95 duration-500 ease-out">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-50 border border-red-100 text-red-600 mb-6 shadow-sm">
            <AlertTriangle className="h-8 w-8" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Critical System Error
          </h1>

          <p className="text-base text-gray-500 font-light max-w-md mx-auto mb-8 leading-relaxed">
            The application root encountered an unexpected exception.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </body>
    </html>
  );
}
