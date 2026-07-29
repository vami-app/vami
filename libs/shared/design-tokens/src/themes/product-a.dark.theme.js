/** @type {import('../tokens.contract').ThemeContract} */
export const productADarkTheme = {
  name: 'product-a',
  mode: 'dark',
  primitives: {
    color: {
      slate50: '#f8fafc',
      slate100: '#f1f5f9',
      slate200: '#e2e8f0',
      slate300: '#cbd5e1',
      slate400: '#94a3b8',
      slate500: '#64748b',
      slate600: '#475569',
      slate700: '#334155',
      slate800: '#1e293b',
      slate900: '#0f172a',
      slate950: '#020617',
      blue50: '#eff6ff',
      blue100: '#dbeafe',
      blue500: '#3b82f6',
      blue600: '#2563eb',
      blue700: '#1d4ed8',
      red500: '#ef4444',
      amber500: '#f59e0b',
      emerald500: '#10b981',
      white: '#ffffff',
      black: '#000000',
    },
    space: {
      0: '0px',
      px: '1px',
      1: '0.25rem', // 4px
      2: '0.5rem', // 8px
      3: '0.75rem', // 12px
      4: '1rem', // 16px
      6: '1.5rem', // 24px
      8: '2rem', // 32px
      12: '3rem', // 48px
    },
    radius: {
      none: '0px',
      sm: '0.25rem',
      md: '0.5rem',
      lg: '0.75rem',
      full: '9999px',
    },
    typography: {
      fontSans: 'Inter, system-ui, -apple-system, sans-serif',
      fontMono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      sizeXs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
      sizeSm: 'clamp(0.875rem, 0.8rem + 0.38vw, 1rem)',
      sizeMd: 'clamp(1rem, 0.95rem + 0.25vw, 1.125rem)',
      sizeLg: 'clamp(1.125rem, 1.05rem + 0.38vw, 1.25rem)',
      sizeXl: 'clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)',
      sizeXl2: 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
    },
    shadow: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.5)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.4)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.4)',
    },
  },
  color: {
    backgroundPrimary: '#171527', // Very deep purple/black
    backgroundSecondary: '#1C1A2E', // Sidebar background
    backgroundSubdued: '#2B2742',
    surfaceCard: '#222038', // Card background
    surfaceElevated: '#2A2742',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A6BE', // Muted text
    textSubtle: '#787593',
    borderSubtle: '#332F4D',
    borderStrong: '#443F63',
    brandAccent: '#A485FF', // Lilac/Purple
    brandHover: '#916DFF',
    danger: '#FF4C6A',
    success: '#10B981',
    warning: '#F59E0B',
    cyan: '#00F0FF', // Special chart color
  },
  spacing: {
    xs: 'var(--vami-primitive-space-1)',
    sm: 'var(--vami-primitive-space-2)',
    md: 'var(--vami-primitive-space-4)',
    lg: 'var(--vami-primitive-space-6)',
    xl: 'var(--vami-primitive-space-8)',
    xl2: 'var(--vami-primitive-space-12)',
  },
  radius: {
    none: 'var(--vami-primitive-radius-none)',
    sm: 'var(--vami-primitive-radius-sm)',
    md: 'var(--vami-primitive-radius-md)',
    lg: 'var(--vami-primitive-radius-lg)',
    full: 'var(--vami-primitive-radius-full)',
  },
  breakpoint: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    xl2: '1536px',
  },
  typography: {
    fontSans: 'var(--vami-primitive-typography-font-sans)',
    fontMono: 'var(--vami-primitive-typography-font-mono)',
    sizeXs: 'var(--vami-primitive-typography-size-xs)',
    sizeSm: 'var(--vami-primitive-typography-size-sm)',
    sizeMd: 'var(--vami-primitive-typography-size-md)',
    sizeLg: 'var(--vami-primitive-typography-size-lg)',
    sizeXl: 'var(--vami-primitive-typography-size-xl)',
    sizeXl2: 'var(--vami-primitive-typography-size-xl2)',
  },
  shadow: {
    sm: 'var(--vami-primitive-shadow-sm)',
    md: 'var(--vami-primitive-shadow-md)',
    lg: 'var(--vami-primitive-shadow-lg)',
  },
};
