const React = require('react');
const { useTheme } = require('../theme/ThemeProvider');

/**
 * @param {{ columns?: number | string, gap?: 'xs' | 'sm' | 'md' | 'lg', children?: React.ReactNode }} props
 */
function Grid({ columns = 'repeat(auto-fit, minmax(280px, 1fr))', gap = 'md', children }) {
  const theme = useTheme();

  const gridTemplateColumns = typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns;

  return React.createElement(
    'div',
    {
      style: {
        display: 'grid',
        gridTemplateColumns,
        gap: theme.spacing[gap] || theme.spacing.md,
      },
    },
    children
  );
}

module.exports = Grid;
