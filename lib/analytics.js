/**
 * Client analytics helpers — safe no-ops until GA is consented + configured.
 */

/**
 * @param {string} name
 * @param {Record<string, unknown>} [params]
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (localStorage.getItem('cookie-consent') !== 'accepted') return;
  } catch {
    return;
  }

  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
    return;
  }

  try {
    // @next/third-parties sendGAEvent when available
    import('@next/third-parties/google')
      .then((mod) => {
        if (typeof mod.sendGAEvent === 'function') {
          mod.sendGAEvent('event', name, params);
        }
      })
      .catch(() => {});
  } catch {
    /* ignore */
  }
}
