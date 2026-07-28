// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * Playwright E2E Configuration for Inkwell
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: "./specs",
  fullyParallel: false,
  workers: 1, // Single worker to prevent Mailtrap rate limits or parallel race conditions
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "report.xml" }],
  ],
  use: {
    baseURL: process.env.CLIENT_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
