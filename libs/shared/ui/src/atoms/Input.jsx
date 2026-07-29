import React, { forwardRef } from 'react';
import { useTheme } from '../theme/ThemeProvider.jsx';

/**
 * @type {React.ForwardRefExoticComponent<{
 *   type?: string,
 *   value?: string,
 *   placeholder?: string,
 *   onChange?: (e: any) => void,
 *   id?: string,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Input = forwardRef(function Input({ type = 'text', value, placeholder, onChange, id, className = '', style = {}, ...rest }, ref) {
  const { theme } = useTheme();

  return React.createElement('input', {
    ref,
    type,
    value,
    placeholder,
    onChange,
    id,
    className,
    style: {
      backgroundColor: theme.color.backgroundPrimary,
      color: theme.color.textPrimary,
      border: `1px solid ${theme.color.borderSubtle}`,
      borderRadius: theme.radius.sm,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: '14px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
      ...style,
    },
    ...rest,
  });
});

