'use client';

/**
 * components/pwa/OfflineIndicator.jsx
 *
 * A slim banner that appears when the browser detects an offline state.
 * Positioned at the bottom-left to avoid colliding with FloatingContactButton
 * (which is bottom-right) and UpdateAvailable (which is top).
 *
 * Self-contained — does NOT rely on react-hot-toast.
 */

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`fixed bottom-6 left-4 sm:left-6 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        isOnline
          ? 'translate-y-16 opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label={isOnline ? undefined : 'You are currently offline'}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-text-primary text-text-inverse text-xs font-medium rounded-full shadow-xl">
        <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>You&apos;re offline</span>
      </div>
    </div>
  );
}
