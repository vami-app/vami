'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * @param {import("next-themes/dist/types").ThemeProviderProps} props
 */
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
