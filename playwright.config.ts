import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Testes compartilham localStorage mockado — NÃO podem rodar em paralelo */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Workers = 1 para evitar poluição de dados entre testes via localStorage */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:9002',

    /* Timeout for each action in milliseconds. */
    actionTimeout: 15000,
    navigationTimeout: 60000,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  expect: {
    timeout: 10000,
  },

  /* Timeout de 3 minutos para permitir ciclos de vida longos (Next.js Dev mode compilação) */
  timeout: 180000,

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'iPhone 12',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Android Pixel 5',
      use: { ...devices['Pixel 5'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npx next dev -p 9002',
    url: 'http://localhost:9002',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
