import { defineConfig } from 'drizzle-kit';

/**
 * Migrations are generated from lib/schema.ts into drizzle/ and applied by the
 * application on start (see lib/db.ts), or manually with `pnpm db:migrate`.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.WIKI_DATABASE_URL || '',
  },
  migrations: {
    schema: 'public',
    table: 'wiki_migrations',
  },
  strict: true,
  verbose: true,
});
