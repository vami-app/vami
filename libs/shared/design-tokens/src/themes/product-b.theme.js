const raw = require('../raw/base.tokens.json');

/** @type {import('../tokens.contract').ThemeContract} */
const productBTheme = {
  name: 'product-b',
  color: {
    backgroundPrimary: raw.color.white,
    backgroundSubdued: raw.color.gray100,
    foregroundPrimary: raw.color.gray800,
    brandAccent: raw.color.purple500, // Product B distinct brand color
    danger: raw.color.red500,
  },
  spacing: {
    xs: raw.spacing['1'],
    sm: raw.spacing['2'],
    md: raw.spacing['4'],
    lg: raw.spacing['6'],
    xl: raw.spacing['8'],
  },
  radius: {
    sm: raw.radius.sm,
    md: raw.radius.md,
    lg: raw.radius.lg,
  },
  breakpoint: raw.breakpoint,
};

module.exports = productBTheme;
