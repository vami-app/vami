'use client';

import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShow(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-base p-4 shadow-lg z-50 flex flex-col sm:flex-row items-center justify-between">
      <div className="text-sm text-text-secondary mb-4 sm:mb-0 max-w-3xl">
        🍪 Cookie Notice: Radhey Metal Alloys LLP uses basic cookies to optimize your browsing experience, track website performance, and remember your choices on our quotation forms. By continuing to use our website, you agree to our use of cookies.
      </div>
      <div className="flex gap-4">
        <button onClick={() => setShow(false)} className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary">
          Learn More
        </button>
        <button onClick={accept} className="px-6 py-2 bg-text-primary text-text-inverse text-sm font-medium rounded-full hover:opacity-90">
          Accept
        </button>
      </div>
    </div>
  );
}
