'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';

export function UpdateAvailable() {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const checkForWaiting = (registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setVisible(true);
      }
    };

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach(checkForWaiting);
    });

    const handleRegistration = (registration) => {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(installing);
            setVisible(true);
          }
        });
      });

      checkForWaiting(registration);
    };

    navigator.serviceWorker.ready.then(handleRegistration);
  }, []);

  const handleReload = useCallback(() => {
    if (!waitingWorker) return;

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }, [waitingWorker]);

  const dismiss = () => setVisible(false);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[70] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        visible ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-sm">
          <Icon icon={RefreshCw} size="sm" className="shrink-0 animate-spin" aria-hidden="true" />
          <span>A new version of the site is available.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleReload}
            variant="outline"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg text-text-primary bg-surface hover:bg-surface-subtle transition-opacity whitespace-nowrap"
          >
            Reload now
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={dismiss}
            className="h-8 w-8 text-primary-foreground hover:bg-primary/80 transition-colors"
            aria-label="Dismiss update notification"
          >
            <Icon icon={X} size="sm" />
          </Button>
        </div>
      </div>
    </div>
  );
}
