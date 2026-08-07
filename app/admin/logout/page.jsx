'use client';

import { useEffect } from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutPage() {
  useEffect(() => {
    fetch('/api/auth/logout', { method: 'POST' })
      .finally(() => {
        window.location.href = '/admin/login';
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-4">
      <div className="text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-lg bg-surface border border-border-subtle shadow-sm mb-4">
          <LogOut className="h-6 w-6 text-text-muted animate-pulse" />
        </div>
        <h1 className="text-xl font-headline font-bold text-text-primary tracking-tight">
          Signing Out
        </h1>
        <p className="mt-1 text-sm text-text-muted font-light">
          Clearing session and redirecting to login...
        </p>
      </div>
    </div>
  );
}

