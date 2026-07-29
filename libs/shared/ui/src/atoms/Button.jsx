import React, { forwardRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * @type {React.ForwardRefExoticComponent<{
 *   variant?: 'primary' | 'danger' | 'subdued',
 *   disabled?: boolean,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   children?: React.ReactNode,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Button = forwardRef(function Button({ variant = 'primary', disabled = false, className = '', style = {}, children, ...rest }, ref) {
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
      ref,
      disabled,
      className,
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
        ...style,
      },
      ...rest,
    },
    children
  );
});

