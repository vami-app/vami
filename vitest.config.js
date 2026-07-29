const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Scope test discovery to libs, services, and apps specs.
    include: [
      'libs/**/*.spec.js',
      'services/**/*.spec.js',
      'apps/**/*.spec.js',
      'apps/**/*.test.js',
      'apps/**/*.test.jsx',
    ],
    exclude: ['node_modules', 'dist', '**/*.config.js'],
    setupFiles: ['apps/product-a-web/src/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
});
