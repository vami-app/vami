import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vami/ui': resolve(__dirname, '../../libs/shared/ui/src'),
      '@vami/design-tokens': resolve(__dirname, '../../libs/shared/design-tokens/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // All /api requests proxied to the BFF during development
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.js'],
  },
});
