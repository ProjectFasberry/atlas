import { spawn } from 'node:child_process';
import process from 'node:process';

/**
 * Test server for Playwright: starts the api mock and `vike dev` with test env values, so
 * the run never talks to the real backend. Vite exposes these `process.env` entries as
 * `import.meta.env` (both `VITE_*` and the `PUBLIC_ENV__*` pair).
 */
const port = process.env.E2E_PORT ?? '3101';
const mockPort = process.env.MOCK_PORT ?? '4546';

const env = {
  ...process.env,
  PUBLIC_ENV__API_URL: `http://127.0.0.1:${mockPort}`,
  PUBLIC_ENV__TG_NAME: 'fasberry',
  VITE_LANDING_ENDPOINT: `http://127.0.0.1:${port}`,
  VITE_VOLUME_URL: 'https://volume.fasberry.fun',
  VITE_APP_URL: 'https://app.fasberry.fun',
  VITE_MAIN_DOMAIN: 'fasberry.fun',
  VITE_SUPPORT_EMAIL: 'support@fasberry.fun',
};

const children = [];

const mock = spawn('node', ['e2e/mock-backend.mjs'], { env, stdio: 'inherit' });
children.push(mock);

const app = spawn('pnpm', ['exec', 'vike', 'dev', '--port', port], { env, stdio: 'inherit' });
children.push(app);

const shutdown = (code = 0) => {
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
};

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

app.on('exit', (code) => shutdown(code ?? 1));
