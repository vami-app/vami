'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeToggle({ className = '' }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-full border border-border-subtle bg-surface-muted ${className}`} />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full border border-border-subtle bg-surface hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors ${className}`}
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 absolute transition-all scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
      <Moon className="h-4 w-4 absolute transition-all scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
    </button>
  );
}
