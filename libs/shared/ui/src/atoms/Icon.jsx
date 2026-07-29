import React, { forwardRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * @type {React.ForwardRefExoticComponent<{
 *   name: string,
 *   size?: number,
 *   ariaLabel?: string,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Icon = forwardRef(function Icon({ name, size = 20, ariaLabel, className = '', style = {}, ...rest }, ref) {
  const { theme } = useTheme();

  return React.createElement(
    'span',
    {
      ref,
      role: 'img',
      'aria-label': ariaLabel || `${name} icon`,
      className,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        color: theme.color.textPrimary,
        ...style,
      },
      ...rest,
    },
    `[${name}]`
  );
});
