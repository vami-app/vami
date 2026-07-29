import React, { forwardRef } from 'react';

/**
 * Status Badge atom.
 *
 * @type {React.ForwardRefExoticComponent<{
 *   variant?: 'brand' | 'success' | 'warning' | 'danger' | 'subtle',
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Badge = forwardRef(function Badge({ variant = 'brand', children, style = {}, className = '', ...rest }, ref) {
  const variantStyles = {
    brand: {
      background: 'var(--vami-color-brand-accent, #2563eb)',
      color: '#ffffff',
    },
    success: {
      background: 'var(--vami-color-success, #10b981)',
      color: '#ffffff',
    },
    warning: {
      background: 'var(--vami-color-warning, #f59e0b)',
      color: '#ffffff',
    },
    danger: {
      background: 'var(--vami-color-danger, #ef4444)',
      color: '#ffffff',
    },
    subtle: {
      background: 'var(--vami-color-background-subdued, #f1f5f9)',
      color: 'var(--vami-color-text-secondary, #475569)',
    },
  };

  const selected = variantStyles[variant] || variantStyles.brand;

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    borderRadius: 'var(--vami-radius-full, 9999px)',
    fontSize: 'var(--vami-typography-size-xs, 12px)',
    fontWeight: '600',
    lineHeight: '1',
    background: selected.background,
    color: selected.color,
    ...style,
  };

  return React.createElement('span', { ref, className, style: combinedStyle, ...rest }, children);
});

