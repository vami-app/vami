const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Scope test discovery to source library specs only.
    // Prevents accidental execution of config files or generated artifacts.
    include: ['libs/**/*.spec.js'],
    exclude: ['node_modules', 'dist', '**/*.config.js'],
    coverage: {
      // v8 provider uses Node's built-in coverage — no extra instrumentation needed.
      provider: 'v8',
      // text: printed to console after each run.
      // lcov: machine-readable format for CI artifact upload and coverage dashboards.
      reporter: ['text', 'lcov'],
    },
  },
});
