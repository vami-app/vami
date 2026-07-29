import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * @param {{
 *   variant?: 'primary' | 'danger' | 'subdued',
 *   ariaLabel?: string,
 *   disabled?: boolean,
 *   onClick?: (e: any) => void,
 *   children?: React.ReactNode
 * }} props
 */
export function Button({ variant = 'primary', ariaLabel, disabled = false, onClick, children }) {
  const { theme } = useTheme();

  let bg = theme.color.brandAccent;
  let fg = theme.color.backgroundPrimary;

  if (variant === 'danger') {
    bg = theme.color.danger;
  } else if (variant === 'subdued') {
    bg = theme.color.backgroundSubdued;
    fg = theme.color.textPrimary;
  }

  return React.createElement(
    'button',
    {
      onClick: disabled ? undefined : onClick,
      disabled,
      'aria-label': ariaLabel,
      style: {
        backgroundColor: bg,
        color: fg,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        borderRadius: theme.radius.md,
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontSize: '14px',
        fontWeight: 600,
        transition: 'all 0.2s ease-in-out',
      },
    },
    children
  );
}
