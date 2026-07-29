import React from 'react';

/**
 * Typography Text atom.
 *
 * @param {{
 *   as?: React.ElementType,
 *   size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl',
 *   weight?: 'normal' | 'medium' | 'semibold' | 'bold',
 *   color?: string,
 *   align?: 'left' | 'center' | 'right',
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string
 * }} props
 */
export function Text({
  as: Component = 'p',
  size = 'md',
  weight = 'normal',
  color = 'var(--vami-color-text-primary, inherit)',
  align = 'left',
  children,
  style = {},
  className = '',
}) {
  const fontSizes = {
    xs: 'var(--vami-typography-size-xs, 12px)',
    sm: 'var(--vami-typography-size-sm, 14px)',
    md: 'var(--vami-typography-size-md, 16px)',
    lg: 'var(--vami-typography-size-lg, 18px)',
    xl: 'var(--vami-typography-size-xl, 24px)',
  };

  const fontWeights = {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  };

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    fontSize: fontSizes[size] || fontSizes.md,
    fontWeight: fontWeights[weight] || fontWeights.normal,
    fontFamily: 'var(--vami-typography-font-sans, sans-serif)',
    color,
    textAlign: align,
    margin: 0,
    ...style,
  };

  return React.createElement(Component, { className, style: combinedStyle }, children);
}
