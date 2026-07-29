/**
 * Environment configuration.
 * All runtime environment variables are accessed through this module —
 * never read import.meta.env directly in feature or entity code.
 */

export const env = {
  /** API base URL — empty means same-origin (behind reverse proxy) */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  /** Application name shown in page titles and nav */
  appName: import.meta.env.VITE_APP_NAME || 'Vami',
  /** Whether we are running in production */
  isProduction: import.meta.env.PROD,
};
