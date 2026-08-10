'use client';

import { useEffect, useState } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

/**
 * Loads GA4 only after analytics cookie consent = accepted.
 */
export function ConsentAnalytics({ gaId }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      try {
        setAllowed(localStorage.getItem('cookie-consent') === 'accepted' && Boolean(gaId));
      } catch {
        setAllowed(false);
      }
    };
    sync();
    window.addEventListener('cookie-consent-changed', sync);
    return () => window.removeEventListener('cookie-consent-changed', sync);
  }, [gaId]);

  if (!allowed || !gaId) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
