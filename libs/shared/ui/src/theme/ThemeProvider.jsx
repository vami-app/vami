import React from 'react';
import { generateCssVariables } from '@vami/design-tokens';

/**
 * @typedef {'light' | 'dark' | 'system'} ModeSetting
 */

/**
 * @typedef {Object} ThemeContextValue
 * @property {import('@vami/design-tokens/src/tokens.contract').ThemeContract} theme
 * @property {import('@vami/design-tokens/src/tokens.contract').ThemeContract} lightTheme
 * @property {import('@vami/design-tokens/src/tokens.contract').ThemeContract} darkTheme
 * @property {ModeSetting} mode
 * @property {'light' | 'dark'} activeMode
 * @property {(mode: ModeSetting) => void} setMode
 * @property {() => void} toggleMode
 */

/** @type {React.Context<ThemeContextValue | null>} */
export const ThemeContext = React.createContext(/** @type {ThemeContextValue | null} */ (null));

const STORAGE_KEY = 'vami-theme-mode';

/**
 * Enterprise Dual Light/Dark ThemeProvider.
 * Dynamically binds CSS custom variables (--vami-*) to document root,
 * enabling zero-re-render instant theme switching across all components.
 *
 * @param {{
 *   lightTheme: import('@vami/design-tokens/src/tokens.contract').ThemeContract,
 *   darkTheme: import('@vami/design-tokens/src/tokens.contract').ThemeContract,
 *   defaultMode?: ModeSetting,
 *   children?: React.ReactNode
 * }} props
 */
export function ThemeProvider({ lightTheme, darkTheme, defaultMode = 'system', children }) {
  /** @type {[ModeSetting, React.Dispatch<React.SetStateAction<ModeSetting>>]} */
  const [mode, setModeState] = React.useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return /** @type {ModeSetting} */ (saved);
      }
    }
    return defaultMode;
  });

  const [systemPrefersDark, setSystemPrefersDark] = React.useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for OS system theme changes
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (/** @type {MediaQueryListEvent} */ e) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const activeMode = mode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : mode;
  const activeTheme = activeMode === 'dark' ? darkTheme : lightTheme;

  const setMode = React.useCallback((/** @type {ModeSetting} */ newMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  const toggleMode = React.useCallback(() => {
    setModeState((/** @type {ModeSetting} */ prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  // Inject CSS root variables
  React.useLayoutEffect(() => {
    if (typeof document === 'undefined') return;
    const { vars } = generateCssVariables(activeTheme);
    const root = document.documentElement;

    for (const [key, val] of Object.entries(vars)) {
      root.style.setProperty(key, val);
    }

    root.setAttribute('data-theme-mode', activeMode);
    root.setAttribute('data-theme-name', activeTheme.name);
  }, [activeTheme, activeMode]);

  const value = React.useMemo(
    () => ({
      theme: activeTheme,
      lightTheme,
      darkTheme,
      mode,
      activeMode,
      setMode,
      toggleMode,
    }),
    [activeTheme, lightTheme, darkTheme, mode, activeMode, setMode, toggleMode]
  );

  return React.createElement(ThemeContext.Provider, { value }, children);
}

/**
 * Custom hook to access current semantic theme, mode, and mode toggle methods.
 * @returns {ThemeContextValue}
 */
export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}
