const React = require('react');
const { useTheme } = require('../theme/ThemeProvider');

/**
 * @param {{ maxWidth?: string, children?: React.ReactNode }} props
 */
function Container({ maxWidth = '1200px', children }) {
  const theme = useTheme();

  return React.createElement(
    'div',
    {
      style: {
        width: '100%',
        maxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
        paddingLeft: theme.spacing.md,
        paddingRight: theme.spacing.md,
        boxSizing: 'border-box',
      },
    },
    children
  );
}

module.exports = Container;
