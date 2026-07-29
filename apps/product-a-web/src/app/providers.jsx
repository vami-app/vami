import { AuthProvider } from '../entities/user';

/**
 * Providers — composes all React context providers in the correct order.
 *
 * Order matters:
 *   1. AuthProvider — must wrap everything that reads auth state
 *
 * Future providers (ThemeProvider, QueryClientProvider, etc.) go here —
 * never scattered throughout page components.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function Providers({ children }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
