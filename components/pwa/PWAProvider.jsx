'use client';

/**
 * components/pwa/PWAProvider.jsx
 *
 * Wraps SerwistProvider from @serwist/next/react and mounts the three PWA UI
 * components (InstallPrompt, UpdateAvailable, OfflineIndicator).
 *
 * Placed in our own file to:
 * 1. Guarantee the 'use client' boundary regardless of upstream package changes.
 * 2. Give one canonical mount point for all PWA UI.
 *
 * Mounted in app/layout.jsx inside ThemeProvider, outside <Suspense>.
 */

import { SerwistProvider } from '@serwist/next/react';
import InstallPrompt from './InstallPrompt';
import UpdateAvailable from './UpdateAvailable';
import OfflineIndicator from './OfflineIndicator';

export default function PWAProvider({ children }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      // Disable in dev so the SW doesn't intercept HMR and fight Fast Refresh
      disable={process.env.NODE_ENV === 'development'}
    >
      {children}
      <InstallPrompt />
      <UpdateAvailable />
      <OfflineIndicator />
    </SerwistProvider>
  );
}
