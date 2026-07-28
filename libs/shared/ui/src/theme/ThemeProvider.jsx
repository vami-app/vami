const React = require('react');

/** @type {React.Context<import('@vami/design-tokens/src/tokens.contract').ThemeContract | null>} */
const ThemeContext = /** @type {React.Context<import('@vami/design-tokens/src/tokens.contract').ThemeContract | null>} */ (React.createContext(null));

/**
 * @param {{ theme: import('@vami/design-tokens/src/tokens.contract').ThemeContract, children?: React.ReactNode }} props
 */
function ThemeProvider({ theme, children }) {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
}

/**
 * Custom hook to access current semantic theme context.
 * @returns {import('@vami/design-tokens/src/tokens.contract').ThemeContract}
 */
function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider.');
  }
  return context;
}

module.exports = {
  ThemeProvider,
  useTheme,
  ThemeContext,
};
