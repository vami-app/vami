import { useAuth } from './AuthContext';

/**
 * Hook to access the current authenticated user record.
 * @returns {import('./AuthContext').UserRecord | null}
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return user;
}
