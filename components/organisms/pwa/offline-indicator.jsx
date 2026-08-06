'use client';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';

export function OfflineIndicator() {
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
        <Icon icon={WifiOff} size="sm" className="shrink-0" aria-hidden="true" />
        <Text variant="caption" className="text-text-inverse font-medium">You&apos;re offline</Text>
      </div>
    </div>
  );
}
