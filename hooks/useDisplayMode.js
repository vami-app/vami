'use client';

import { useState, useEffect } from 'react';

/**
 * hooks/useDisplayMode.js
 *
 * Returns the current display mode: 'standalone' or 'browser'.
 * Handles both the CSS media query approach (Chrome/Firefox) and
 * the iOS-only navigator.standalone property.
 */
export function useDisplayMode() {
  const [displayMode, setDisplayMode] = useState('browser');

  useEffect(() => {
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');

    const check = () => {
      const isStandalone =
        standaloneQuery.matches ||
        /** @type {any} */ (navigator).standalone === true;
      setDisplayMode(isStandalone ? 'standalone' : 'browser');
    };

    check();

    standaloneQuery.addEventListener('change', check);
    return () => standaloneQuery.removeEventListener('change', check);
  }, []);

  return displayMode;
}
