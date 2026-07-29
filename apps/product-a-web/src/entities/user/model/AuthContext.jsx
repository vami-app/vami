import React, { createContext, useContext, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMe, userKeys } from '@vami/api-client';

/** @typedef {{ id: string, email: string, username: string, roles: string[] }} UserRecord */

const AuthContext = createContext(/** @type {{ user: UserRecord|null, isLoading: boolean, setUser: (u: UserRecord|null) => void } | null} */ (null));

/**
 * AuthProvider — restores session on mount by calling /api/v1/bff/auth/me using TanStack Query.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: userKeys.me(),
    queryFn: fetchMe,
    retry: (failureCount, error) => {
      // Do not retry on 401 Unauthorized
      if (/** @type {any} */ (error)?.status === 401) return false;
      return failureCount < 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  const user = data?.user || null;

  // setUser is used for optimistic updates or logouts
  const setUser = useCallback((/** @type {UserRecord|null} */ newUser) => {
    queryClient.setQueryData(userKeys.me(), newUser ? { user: newUser } : null);
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access the current auth context.
 * @returns {{ user: UserRecord|null, isLoading: boolean, setUser: (u: UserRecord|null) => void }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
