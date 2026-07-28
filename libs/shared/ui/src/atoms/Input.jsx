const React = require('react');
const { useTheme } = require('../theme/ThemeProvider');

/**
 * @param {{
 *   type?: string,
 *   value?: string,
 *   placeholder?: string,
 *   onChange?: (e: any) => void,
 *   id?: string,
 *   ariaLabel?: string
 * }} props
 */
function Input({ type = 'text', value, placeholder, onChange, id, ariaLabel }) {
  const theme = useTheme();

  return React.createElement('input', {
    type,
    value,
    placeholder,
    onChange,
    id,
    'aria-label': ariaLabel,
    style: {
      backgroundColor: theme.color.backgroundPrimary,
      color: theme.color.foregroundPrimary,
      border: `1px solid ${theme.color.backgroundSubdued}`,
      borderRadius: theme.radius.sm,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: '14px',
      outline: 'none',
      width: '100%',
      boxSizing: 'border-box',
    },
  });
}

module.exports = Input;
