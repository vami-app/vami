import React from 'react';

/**
 * Responsive CSS Grid layout primitive.
 * Supports breakpoint column maps or fixed column counts.
 *
 * @param {{
 *   cols?: number | { xs?: number, sm?: number, md?: number, lg?: number, xl?: number },
 *   gap?: string,
 *   children?: React.ReactNode,
 *   style?: React.CSSProperties,
 *   className?: string
 * }} props
 */
export function Grid({ cols = { xs: 1, sm: 2, md: 3, lg: 4 }, gap = 'var(--vami-space-md, 16px)', children, style = {}, className = '' }) {
  const [windowWidth, setWindowWidth] = React.useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1024));

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let columnCount = 1;
  if (typeof cols === 'number') {
    columnCount = cols;
  } else if (cols && typeof cols === 'object') {
    if (windowWidth >= 1280 && cols.xl) columnCount = cols.xl;
    else if (windowWidth >= 1024 && cols.lg) columnCount = cols.lg;
    else if (windowWidth >= 768 && cols.md) columnCount = cols.md;
    else if (windowWidth >= 640 && cols.sm) columnCount = cols.sm;
    else if (cols.xs) columnCount = cols.xs;
  }

  /** @type {React.CSSProperties} */
  const combinedStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
    gap,
    ...style,
  };

  return React.createElement('div', { className, style: combinedStyle }, children);
}
