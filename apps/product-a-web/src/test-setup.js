// Vitest jsdom test setup
// Adds custom matchers: toBeInTheDocument, toHaveTextContent, etc.
import '@testing-library/jest-dom';

// Mock fetch globally for tests that don't need real network
globalThis.fetch = globalThis.fetch || (() => Promise.reject(new Error('fetch not mocked in this test')));
