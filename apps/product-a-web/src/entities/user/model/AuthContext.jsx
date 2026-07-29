import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api/apiClient';

/** @typedef {{ id: string, email: string, username: string, roles: string[] }} UserRecord */

const AuthContext = createContext(/** @type {{ user: UserRecord|null, isLoading: boolean, setUser: (u: UserRecord|null) => void } | null} */ (null));

/**
 * AuthProvider — restores session on mount by calling /api/v1/bff/auth/me.
 *
 * The browser sends the httpOnly access_token cookie automatically.
 * If the token is valid, `user` is set. If not (401), `user` stays null.
 * Components never touch localStorage or cookies directly.
 *
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(/** @type {UserRecord|null} */ (null));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiClient('/api/v1/bff/auth/me')
      .then((/** @type {any} */ data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

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
