'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--surface-muted)',
          color: 'var(--text-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
        },
      }}
    />
  );
}
