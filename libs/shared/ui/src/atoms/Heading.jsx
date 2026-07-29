import React, { forwardRef } from 'react';

/**
 * Semantic Heading atom (h1 - h6).
 *
 * @type {React.ForwardRefExoticComponent<{
 *   level?: 1 | 2 | 3 | 4 | 5 | 6,
 *   color?: string,
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Heading = forwardRef(function Heading({ level = 2, color = 'var(--vami-color-text-primary, inherit)', children, style = {}, className = '', ...rest }, ref) {
  const Component = /** @type {React.ElementType} */ (`h${level}`);

  const levelSizes = {
    1: 'var(--vami-typography-size-xl2, 32px)',
    2: 'var(--vami-typography-size-xl, 24px)',
    3: 'var(--vami-typography-size-lg, 18px)',
    4: 'var(--vami-typography-size-md, 16px)',
    5: 'var(--vami-typography-size-sm, 14px)',
    6: 'var(--vami-typography-size-xs, 12px)',
  };

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    fontSize: levelSizes[level] || levelSizes[2],
    fontWeight: '700',
    fontFamily: 'var(--vami-typography-font-sans, sans-serif)',
    color,
    margin: 0,
    lineHeight: 1.3,
    ...style,
  };

  return React.createElement(Component, { ref, className, style: combinedStyle, ...rest }, children);
});

