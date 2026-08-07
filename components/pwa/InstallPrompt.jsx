'use client';

/**
 * components/pwa/InstallPrompt.jsx
 *
 * Cross-platform PWA install UI:
 * - Android/Chromium: button wired to the captured beforeinstallprompt event
 * - iOS Safari: instructional sheet (no beforeinstallprompt on iOS)
 * - Hidden when already in standalone mode
 * - Dismissal persisted in localStorage with a 7-day cooldown
 * - Suppressed on /admin/* routes
 *
 * Self-contained — does NOT rely on react-hot-toast (Toaster is only mounted per-page).
 */

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, Share, X, Plus } from 'lucide-react';

const DISMISS_KEY = 'pwa-install-dismissed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export default function InstallPrompt() {
  const pathname = usePathname();
  const { canInstall, promptInstall, isIOS, isStandalone } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    // Never show on admin routes
    if (pathname?.startsWith('/admin')) return;
    // Never show when already installed
    if (isStandalone) return;

    // Check dismiss cooldown
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return;
    } catch {
      // localStorage may be unavailable in some contexts
    }

    // Show after a short delay for a smooth entrance
    const timer = setTimeout(() => {
      if (canInstall || isIOS) setVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [canInstall, isIOS, isStandalone, pathname]);

  const dismiss = () => {
    setVisible(false);
    setShowIOSSheet(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSSheet(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setVisible(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Install banner */}
      <div
        className={`fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-sm z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
        }`}
        role="region"
        aria-label="Install app"
      >
        <div className="bg-background/90 backdrop-blur-xl border border-border-subtle shadow-2xl rounded-lg p-5 flex flex-col gap-4 relative">
          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors"
            aria-label="Dismiss install prompt"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3 pr-6">
            {/* App icon */}
            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border-subtle shadow-sm">
              <img
                src="/icons/icon-192.png"
                alt="Radhey Alloys icon"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary leading-tight">
                Add to Home Screen
              </p>
              <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                {isIOS
                  ? 'Install for quick access and offline support.'
                  : 'Install the app for a faster, offline-capable experience.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleInstall}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              {isIOS ? (
                <>
                  <Share className="w-4 h-4" />
                  How to Install
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Install App
                </>
              )}
            </button>
            <button
              onClick={dismiss}
              className="px-4 py-2.5 bg-surface text-text-secondary text-sm font-medium rounded-lg border border-border-subtle hover:bg-surface-muted transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      {/* iOS A2HS instruction sheet */}
      {showIOSSheet && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSSheet(false);
          }}
        >
          <div className="w-full max-w-lg bg-background rounded-t-3xl p-6 pb-10 shadow-2xl border-t border-border-subtle">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-text-primary">Add to Home Screen</h2>
              <button
                onClick={() => setShowIOSSheet(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
                aria-label="Close instructions"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <p className="text-sm text-text-secondary">
                  Tap the{' '}
                  <Share className="inline w-4 h-4 text-blue-500 mx-0.5" aria-label="Share" />{' '}
                  <strong className="text-text-primary">Share</strong> button in the browser toolbar
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <p className="text-sm text-text-secondary">
                  Scroll down and tap{' '}
                  <strong className="text-text-primary inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add to Home Screen
                  </strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <p className="text-sm text-text-secondary">
                  Tap <strong className="text-text-primary">Add</strong> in the top-right corner
                </p>
              </li>
            </ol>

            <button
              onClick={() => { setShowIOSSheet(false); dismiss(); }}
              className="mt-6 w-full py-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
