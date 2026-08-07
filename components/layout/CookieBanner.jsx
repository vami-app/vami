'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Small delay for a smooth entrance animation
      setTimeout(() => setShow(true), 500);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  const dismiss = () => {
    // Dismiss without explicit consent
    setShow(false);
  };

  return (
    <div 
      className={`fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-sm z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
      }`}
    >
      <div className="bg-background/80 backdrop-blur-xl border border-border-subtle shadow-2xl rounded-lg p-5 sm:p-6 flex flex-col gap-4 relative">
        <button 
          onClick={dismiss}
          className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="p-2 bg-surface-muted rounded-lg shrink-0">
            <Cookie className="w-5 h-5 text-text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              We value your privacy
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              We use essential cookies to make our site work safely. We also use analytics cookies to understand how you interact with our site so we can improve it. 
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full mt-2">
          <button 
            onClick={accept} 
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Accept
          </button>
          <Link 
            href="/privacy" 
            className="flex-1 px-4 py-2.5 bg-surface text-text-primary text-[10px] font-semibold uppercase tracking-wider rounded-lg border border-border-subtle hover:bg-surface-muted transition-colors text-center"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  );
}
