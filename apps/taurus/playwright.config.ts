import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT ?? '3101';
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Runs against `vike dev` with a mocked api, see `e2e/serve.mjs`.
 * First local run: `pnpm --filter taurus test:e2e:install`.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL,
    locale: 'ru-RU',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--disable-dev-shm-usage', '--disable-gpu'] },
      },
    },
  ],
  webServer: {
    command: 'node e2e/serve.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
