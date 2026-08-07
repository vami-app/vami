'use client';

/**
 * components/pwa/UpdateAvailable.jsx
 *
 * Listens for a waiting service worker and shows a "New version available" bar.
 * When the user clicks Reload:
 *   1. Posts SKIP_WAITING to the waiting worker (triggers it to activate)
 *   2. Reloads the page on the 'controllerchange' event to pick up new assets
 *
 * This is why sw.js uses skipWaiting: false — the user controls when to apply
 * the update, preventing mid-session asset-version mismatches.
 *
 * Self-contained — does NOT rely on react-hot-toast.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function UpdateAvailable() {
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

    // Check existing registrations
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach(checkForWaiting);
    });

    // Listen for new installations
    const handleRegistration = (registration) => {
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // A new SW is installed and waiting
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

    // Once the controller changes (new SW activates), reload the page
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    }, { once: true });

    // Tell the waiting worker to skip waiting and activate
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
      <div className="bg-primary text-primary-foreground rounded-b-lg px-4 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3 text-sm">
          <RefreshCw className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
          <span>A new version of the site is available.</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReload}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-text-inverse text-text-primary hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            Reload now
          </button>
          <button
            onClick={dismiss}
            className="p-1.5 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            aria-label="Dismiss update notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
