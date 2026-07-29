import { AuthProvider } from '../entities/user';
import { ThemeProvider } from '@vami/ui';
import { productALightTheme, productADarkTheme } from '@vami/design-tokens';

/**
 * Providers — composes all React context providers in the correct order.
 *
 * Order matters:
 *   1. ThemeProvider — global CSS variables & light/dark mode state
 *   2. AuthProvider — user authentication state
 *
 * @param {{ children: React.ReactNode }} props
 */
export function Providers({ children }) {
  return (
    <ThemeProvider lightTheme={productALightTheme} darkTheme={productADarkTheme} defaultMode="system">
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}

