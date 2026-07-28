const React = require('react');
const { useTheme } = require('../theme/ThemeProvider');

/**
 * @param {{ name: string, size?: number, ariaLabel?: string }} props
 */
function Icon({ name, size = 20, ariaLabel }) {
  const theme = useTheme();

  return React.createElement(
    'span',
    {
      role: 'img',
      'aria-label': ariaLabel || `${name} icon`,
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        color: theme.color.foregroundPrimary,
      },
    },
    `[${name}]`
  );
}

module.exports = Icon;
