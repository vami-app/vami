/**
 * Generates CSS custom variable key-value map and CSS declaration string from a ThemeContract.
 * Used by ThemeProvider to dynamically bind --vami-* custom variables to document root.
 *
 * @param {import('./tokens.contract').ThemeContract} theme
 * @returns {{ vars: Record<string, string>, cssString: string }}
 */
export function generateCssVariables(theme) {
  /** @type {Record<string, string>} */
  const vars = {};

  // Primitives (Tier 1)
  if (theme.primitives) {
    for (const [category, tokens] of Object.entries(theme.primitives)) {
      for (const [key, val] of Object.entries(tokens)) {
        const varName = `--vami-primitive-${kebabCase(category)}-${kebabCase(key)}`;
        vars[varName] = val;
      }
    }
  }

  // Semantics / Colors (Tier 2)
  for (const [key, val] of Object.entries(theme.color)) {
    const varName = `--vami-color-${kebabCase(key)}`;
    vars[varName] = val;
  }

  // Spacing
  for (const [key, val] of Object.entries(theme.spacing)) {
    const varName = `--vami-space-${kebabCase(key)}`;
    vars[varName] = val;
  }

  // Radius
  for (const [key, val] of Object.entries(theme.radius)) {
    const varName = `--vami-radius-${kebabCase(key)}`;
    vars[varName] = val;
  }

  // Typography
  for (const [key, val] of Object.entries(theme.typography)) {
    const varName = `--vami-typography-${kebabCase(key)}`;
    vars[varName] = val;
  }

  // Shadows
  for (const [key, val] of Object.entries(theme.shadow)) {
    const varName = `--vami-shadow-${kebabCase(key)}`;
    vars[varName] = val;
  }

  const cssLines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`);
  const cssString = `:root {\n${cssLines.join('\n')}\n}`;

  return { vars, cssString };
}

/**
 * Converts camelCase to kebab-case.
 * @param {string} str
 * @returns {string}
 */
export function kebabCase(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}
