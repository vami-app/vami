'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, Share, X, Plus } from 'lucide-react';
import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { Text } from '@/components/atoms/text';

const DISMISS_KEY = 'pwa-install-dismissed';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function InstallPrompt() {
  const pathname = usePathname();
  const { canInstall, promptInstall, isIOS, isStandalone } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [showIOSSheet, setShowIOSSheet] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    if (isStandalone) return;

    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return;
    } catch {}

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
    } catch {}
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
        <div className="bg-background/90 backdrop-blur-xl border border-border-subtle shadow-2xl rounded-2xl p-5 flex flex-col gap-4 relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={dismiss}
            className="absolute top-4 right-4 h-6 w-6 rounded-full"
            aria-label="Dismiss install prompt"
          >
            <Icon icon={X} size="sm" />
          </Button>

          <div className="flex items-start gap-3 pr-6">
            <div className="shrink-0 w-12 h-12 rounded-2xl overflow-hidden border border-border-subtle shadow-sm">
              <img
                src="/icons/icon-192.png"
                alt="Radhey Alloys icon"
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <Text as="p" variant="cta" className="text-sm leading-tight text-text-primary">
                Add to Home Screen
              </Text>
              <Text variant="caption" className="mt-0.5 leading-relaxed">
                {isIOS
                  ? 'Install for quick access and offline support.'
                  : 'Install the app for a faster, offline-capable experience.'}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleInstall}
              className="flex-1 rounded-xl py-2.5"
            >
              {isIOS ? (
                <>
                  <Icon icon={Share} size="sm" className="mr-2" />
                  How to Install
                </>
              ) : (
                <>
                  <Icon icon={Download} size="sm" className="mr-2" />
                  Install App
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={dismiss}
              className="px-4 py-2.5 rounded-xl"
            >
              Not now
            </Button>
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowIOSSheet(false)}
                className="h-8 w-8 rounded-full"
                aria-label="Close instructions"
              >
                <Icon icon={X} size="md" />
              </Button>
            </div>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-text-primary text-text-inverse text-xs font-bold flex items-center justify-center mt-0.5">1</span>
                <p className="text-sm text-text-secondary">
                  Tap the{' '}
                  <Icon icon={Share} size="sm" className="inline text-blue-500 mx-0.5" aria-label="Share" />{' '}
                  <strong className="text-text-primary">Share</strong> button in the browser toolbar
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-text-primary text-text-inverse text-xs font-bold flex items-center justify-center mt-0.5">2</span>
                <p className="text-sm text-text-secondary">
                  Scroll down and tap{' '}
                  <strong className="text-text-primary inline-flex items-center gap-1">
                    <Icon icon={Plus} size="sm" aria-hidden="true" />
                    Add to Home Screen
                  </strong>
                </p>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-text-primary text-text-inverse text-xs font-bold flex items-center justify-center mt-0.5">3</span>
                <p className="text-sm text-text-secondary">
                  Tap <strong className="text-text-primary">Add</strong> in the top-right corner
                </p>
              </li>
            </ol>

            <Button
              onClick={() => { setShowIOSSheet(false); dismiss(); }}
              className="mt-6 w-full py-3 rounded-2xl"
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
