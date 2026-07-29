import React from 'react';

/**
 * Surface Card molecule component.
 *
 * @param {{
 *   padding?: string,
 *   elevation?: 'none' | 'sm' | 'md' | 'lg',
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string
 * }} props
 */
export function Card({ padding = 'var(--vami-space-md, 16px)', elevation = 'sm', children, style = {}, className = '' }) {
  const shadows = {
    none: 'none',
    sm: 'var(--vami-shadow-sm, 0 1px 2px 0 rgb(0 0 0 / 0.05))',
    md: 'var(--vami-shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
    lg: 'var(--vami-shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1))',
  };

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    background: 'var(--vami-color-surface-card, #ffffff)',
    color: 'var(--vami-color-text-primary, #0f172a)',
    border: '1px solid var(--vami-color-border-subtle, #e2e8f0)',
    borderRadius: 'var(--vami-radius-md, 8px)',
    padding,
    boxShadow: shadows[elevation] || shadows.sm,
    transition: 'background 0.2s ease, border-color 0.2s ease',
    ...style,
  };

  return React.createElement('div', { className, style: combinedStyle }, children);
}
