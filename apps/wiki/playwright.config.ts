import { defineConfig, devices } from '@playwright/test';

const port = process.env.E2E_PORT ?? '3100';
const baseURL = `http://127.0.0.1:${port}`;

/**
 * Runs against `next start` with the e2e database and a mock backend, see `e2e/serve.mjs`.
 * Before the first local run: `docker run -d --name wiki-e2e-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=wiki_e2e -p 55432:5432 postgres:16-alpine`
 * and `E2E_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/wiki_e2e pnpm test:e2e`.
 */
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.artifacts',
  timeout: 30_000,
  expect: { timeout: 7_000 },
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
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'node e2e/serve.mjs',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
