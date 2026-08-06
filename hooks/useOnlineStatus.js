'use client';

import { useState, useEffect } from 'react';

/**
 * hooks/useOnlineStatus.js
 *
 * SSR-safe hook that tracks the browser's online/offline status.
 * Initialises to `true` on the server (safe default).
 * Hydrates from navigator.onLine in useEffect and subscribes to events.
 */
export function useOnlineStatus() {
  // Start with true on server — avoids hydration mismatch
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Hydrate from actual state after mount
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
