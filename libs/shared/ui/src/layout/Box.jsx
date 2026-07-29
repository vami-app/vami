import React, { forwardRef } from 'react';

/**
 * Base token-driven layout primitive <Box>.
 * Supports token-driven padding, margin, background, border, radius, shadow, and color props.
 *
 * @type {React.ForwardRefExoticComponent<{
 *   as?: React.ElementType,
 *   padding?: string,
 *   margin?: string,
 *   background?: string,
 *   color?: string,
 *   border?: string,
 *   borderRadius?: string,
 *   boxShadow?: string,
 *   className?: string,
 *   style?: React.CSSProperties,
 *   children?: React.ReactNode,
 *   [key: string]: any
 * } & React.RefAttributes<any>>}
 */
export const Box = forwardRef(function Box({
  as: Component = 'div',
  padding,
  margin,
  background = 'var(--vami-color-surface-card, transparent)',
  color = 'var(--vami-color-text-primary, inherit)',
  border = '1px solid var(--vami-color-border-subtle, transparent)',
  borderRadius = 'var(--vami-radius-md, 8px)',
  boxShadow,
  className = '',
  style = {},
  children,
  ...rest
}, ref) {
  /** @type {React.CSSProperties} */
  const combinedStyle = {
    padding,
    margin,
    background,
    color,
    border,
    borderRadius,
    boxShadow,
    ...style,
  };

  return React.createElement(
    Component,
    {
      ref,
      className,
      style: combinedStyle,
      ...rest,
    },
    children
  );
});

