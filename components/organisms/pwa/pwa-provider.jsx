'use client';

import { SerwistProvider } from '@serwist/next/react';
import { InstallPrompt } from '@/components/organisms/pwa/install-prompt';
import { UpdateAvailable } from '@/components/organisms/pwa/update-available';
import { OfflineIndicator } from '@/components/organisms/pwa/offline-indicator';

export function PWAProvider({ children }) {
  return (
    <SerwistProvider
      swUrl="/sw.js"
      disable={process.env.NODE_ENV === 'development'}
    >
      {children}
      <InstallPrompt />
      <UpdateAvailable />
      <OfflineIndicator />
    </SerwistProvider>
  );
}
