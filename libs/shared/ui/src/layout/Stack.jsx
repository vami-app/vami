import React, { forwardRef } from 'react';

/**
 * Flexbox stack layout primitive supporting vertical/horizontal direction and token-driven gap.
 *
 * @type {React.ForwardRefExoticComponent<{
 *   direction?: 'column' | 'row' | 'row-reverse' | 'column-reverse',
 *   align?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline',
 *   justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around',
 *   gap?: string,
 *   wrap?: boolean,
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Stack = forwardRef(function Stack({
  direction = 'column',
  align = 'stretch',
  justify = 'flex-start',
  gap = 'var(--vami-space-md, 16px)',
  wrap = false,
  children,
  style = {},
  className = '',
  ...rest
}, ref) {
  /** @type {React.CSSProperties} */
  const combinedStyle = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    gap,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    ...style,
  };

  return React.createElement('div', { ref, className, style: combinedStyle, ...rest }, children);
});

