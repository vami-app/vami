import React from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * @param {{ name: string, size?: number, ariaLabel?: string }} props
 */
export function Icon({ name, size = 20, ariaLabel }) {
  const { theme } = useTheme();

  return React.createElement(
    'span',
    {
      role: 'img',
      'aria-label': ariaLabel || `${name} icon`,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        color: theme.color.textPrimary,
      },
    },
    `[${name}]`
  );
}
