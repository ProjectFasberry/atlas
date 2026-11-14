import { spawn, spawnSync } from 'node:child_process';
import process from 'node:process';

/**
 * Test server for Playwright: migrates and seeds the e2e database, starts the backend
 * mock and `next start`. Playwright runs it through `webServer` and kills it afterwards.
 */
const databaseUrl = process.env.E2E_DATABASE_URL;
if (!databaseUrl) throw new Error('E2E_DATABASE_URL is required, for example postgres://postgres:postgres@127.0.0.1:55432/wiki_e2e');
if (!/e2e/i.test(databaseUrl)) throw new Error('E2E_DATABASE_URL must point to a test database, not to a real one');

const port = process.env.E2E_PORT ?? '3100';
const mockPort = process.env.MOCK_PORT ?? '4545';

const env = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  WIKI_AUTH_CHECK_URL: `http://127.0.0.1:${mockPort}/wiki/access`,
  WIKI_API_URL: `http://127.0.0.1:${mockPort}`,
  NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
  PORT: port,
};

function run(command, args, commandEnv = env) {
  const result = spawnSync(command, args, { env: commandEnv, stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} failed`);
}

run('pnpm', ['exec', 'drizzle-kit', 'migrate']);
run('node', ['e2e/seed.mjs']);

const children = [];

const mock = spawn('node', ['e2e/mock-backend.mjs'], { env, stdio: 'inherit' });
children.push(mock);

const app = spawn('pnpm', ['exec', 'next', 'start', '-p', port], { env, stdio: 'inherit' });
children.push(app);

const shutdown = (code = 0) => {
  for (const child of children) child.kill('SIGTERM');
  process.exit(code);
};

process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));

app.on('exit', (code) => shutdown(code ?? 1));
