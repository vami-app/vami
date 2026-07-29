import { AuthProvider } from '../entities/user';
import { ThemeProvider } from '@vami/ui';
import { productALightTheme, productADarkTheme } from '@vami/design-tokens';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

/**
 * Providers — composes all React context providers in the correct order.
 *
 * Order matters:
 *   1. ThemeProvider — global CSS variables & light/dark mode state
 *   2. QueryClientProvider - server state singleton
 *   3. AuthProvider — user authentication state
 *
 * @param {{ children: React.ReactNode }} props
 */
export function Providers({ children }) {
  return (
    <ThemeProvider lightTheme={productALightTheme} darkTheme={productADarkTheme} defaultMode="system">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
