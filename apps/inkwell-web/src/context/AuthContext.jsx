"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

/**
 * @typedef {Object} AuthUser
 * @property {string} id
 * @property {string} name
 * @property {string} username
 * @property {string} email
 * @property {string} bio
 * @property {string} avatarUrl
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user
 * @property {boolean} loading
 * @property {(email:string,password:string)=>Promise<void>} login
 * @property {(payload:Object)=>Promise<void>} register
 * @property {()=>Promise<void>} logout
 * @property {(u:AuthUser)=>void} setUser
 * @property {()=>Promise<void>} refreshUser
 */

const AuthContext = createContext(/** @type {AuthContextValue|null} */ (null));

/**
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(/** @type {AuthUser|null} */ (null));
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get("/api/auth/me");
      setUser(data.user);
    } catch (e) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await api.post("/api/auth/login", { email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api.post("/api/auth/register", payload);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      /* ignore */
    }
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, setUser, refreshUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
