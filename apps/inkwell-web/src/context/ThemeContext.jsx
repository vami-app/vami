"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "./AuthContext";

/**
 * @typedef {'light' | 'dark' | 'system'} ThemePreference
 * @typedef {'light' | 'dark'} ResolvedTheme
 *
 * @typedef {Object} ThemeContextValue
 * @property {ThemePreference} theme
 * @property {ResolvedTheme} resolvedTheme
 * @property {(newTheme: ThemePreference) => Promise<void>} setTheme
 */

const ThemeContext = createContext(/** @type {ThemeContextValue|null} */ (null));

/**
 * Helper to get cookie value client-side
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(name) {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift() || null;
  return null;
}

/**
 * Helper to set theme cookie client-side
 * @param {string} value
 */
function setThemeCookie(value) {
  if (typeof document === "undefined") return;
  document.cookie = `theme=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function ThemeProvider({ children, initialTheme = "system" }) {
  const { user } = useAuth();
  const [theme, setThemeState] = useState(/** @type {ThemePreference} */ (initialTheme));
  const [resolvedTheme, setResolvedTheme] = useState(/** @type {ResolvedTheme} */ ("light"));

  // Sync state with user preference when logged in or with cookie
  useEffect(() => {
    if (user && user.themePreference) {
      setThemeState(user.themePreference);
    } else {
      const cookieTheme = getCookie("theme");
      if (cookieTheme && ["light", "dark", "system"].includes(cookieTheme)) {
        setThemeState(/** @type {ThemePreference} */ (cookieTheme));
      }
    }
  }, [user]);

  // Apply resolved theme class to documentElement
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "system") {
        isDark = mediaQuery.matches;
      } else {
        isDark = false;
      }

      const activeTheme = isDark ? "dark" : "light";
      setResolvedTheme(activeTheme);

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    updateResolvedTheme();

    const handleChange = () => {
      if (theme === "system") {
        updateResolvedTheme();
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = useCallback(
    async (newTheme) => {
      if (!["light", "dark", "system"].includes(newTheme)) return;
      setThemeState(newTheme);
      setThemeCookie(newTheme);

      if (user) {
        try {
          await api.patch("/api/users/me", { themePreference: newTheme });
        } catch (err) {
          console.error("Failed to persist theme preference:", err);
        }
      }
    },
    [user]
  );

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
