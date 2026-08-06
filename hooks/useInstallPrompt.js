'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

const getIsIOS = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
};

const getIsStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || /** @type {any} */ (navigator).standalone === true;
};

const subscribeStandalone = (callback) => {
  if (typeof window === 'undefined') return () => {};
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

/**
 * hooks/useInstallPrompt.js
 *
 * Captures the beforeinstallprompt event (Chrome/Edge/Samsung Internet) and
 * exposes a cross-platform install API including iOS detection.
 *
 * Returns:
 *   canInstall   — true when beforeinstallprompt was captured (Android/desktop)
 *   promptInstall — call this to show the native install dialog
 *   isIOS        — true on iPad/iPhone/iPod (no beforeinstallprompt; needs A2HS instructions)
 *   isStandalone — true when already running as installed PWA
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const isIOS = useSyncExternalStore(emptySubscribe, getIsIOS, () => false);
  const isStandalone = useSyncExternalStore(subscribeStandalone, getIsStandalone, () => false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // Prevent the default mini-infobar
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Clear — the prompt can only be used once
    setDeferredPrompt(null);
    return outcome; // 'accepted' | 'dismissed'
  }, [deferredPrompt]);

  return {
    canInstall: !!deferredPrompt,
    promptInstall,
    isIOS,
    isStandalone,
  };
}
