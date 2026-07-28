const React = require('react');
const { useTheme } = require('../theme/ThemeProvider');

/**
 * @param {{ direction?: 'row' | 'column', gap?: 'xs' | 'sm' | 'md' | 'lg', align?: string, justify?: string, children?: React.ReactNode }} props
 */
function Stack({ direction = 'column', gap = 'md', align = 'stretch', justify = 'flex-start', children }) {
  const theme = useTheme();

  return React.createElement(
    'div',
    {
      style: {
        display: 'flex',
        flexDirection: direction,
        gap: theme.spacing[gap] || theme.spacing.md,
        alignItems: align,
        justifyContent: justify,
      },
    },
    children
  );
}

module.exports = Stack;
