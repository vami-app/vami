import React from 'react';

/**
 * Centered container layout primitive with max-width breakpoint bounds.
 *
 * @param {{
 *   size?: 'sm' | 'md' | 'lg' | 'xl' | 'full',
 *   padding?: string,
 *   children?: React.ReactNode,
 *   className?: string,
 *   style?: React.CSSProperties
 * }} props
 */
export function Container({ size = 'lg', padding = '0 16px', children, className = '', style = {} }) {
  const maxWidths = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    full: '100%',
  };

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    width: '100%',
    maxWidth: maxWidths[size] || maxWidths.lg,
    marginLeft: 'auto',
    marginRight: 'auto',
    padding,
    boxSizing: 'border-box',
    ...style,
  };

  return React.createElement('div', { className, style: combinedStyle }, children);
}
