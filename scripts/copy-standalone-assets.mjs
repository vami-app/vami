import fs from 'node:fs';

const copyOptions = { recursive: true };

try {
  // The standalone server does not copy public and .next/static folders by default.
  // We need to copy them manually so the standalone server can serve them.
  fs.cpSync('public', '.next/standalone/public', copyOptions);
  fs.cpSync('.next/static', '.next/standalone/.next/static', copyOptions);
  console.log('✓ Copied public and .next/static to .next/standalone');
} catch (err) {
  console.error('Failed to copy standalone assets:', err);
  process.exit(1);
}
