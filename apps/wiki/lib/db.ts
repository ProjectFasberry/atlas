import path from 'node:path';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

type Global = typeof globalThis & {
  __fasberryWikiPool?: pg.Pool;
  __fasberryWikiDb?: Database;
  __fasberryWikiReady?: Promise<void>;
};

/**
 * Connection settings come from DATABASE_URL, or from the standard PG* variables
 * (PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE) when the password cannot be put
 * into a URI without escaping.
 */
export function connectionConfig(): pg.PoolConfig {
  const url = process.env.DATABASE_URL || process.env.WIKI_DATABASE_URL;
  if (url) return { connectionString: url };

  const { PGHOST, PGUSER, PGDATABASE } = process.env;
  if (PGHOST && PGUSER && PGDATABASE) {
    return {
      host: PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: PGUSER,
      password: process.env.PGPASSWORD,
      database: PGDATABASE,
    };
  }

  throw new Error('DATABASE_URL or PG* variables are not set');
}

export function getPool() {
  const g = globalThis as Global;
  if (g.__fasberryWikiPool) return g.__fasberryWikiPool;

  const pool = new pg.Pool({
    ...connectionConfig(),
    max: Number(process.env.WIKI_DB_POOL_MAX || 8),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'fasberry-wiki',
  });

  g.__fasberryWikiPool = pool;
  return pool;
}

export function getDb(): Database {
  const g = globalThis as Global;
  if (g.__fasberryWikiDb) return g.__fasberryWikiDb;

  const db = drizzle(getPool(), { schema });
  g.__fasberryWikiDb = db;
  return db;
}

/**
 * Migrations from `drizzle/` are applied once per process, so a fresh database
 * needs no manual step and a running container picks up new migrations on deploy.
 */
async function runMigrations(db: Database) {
  await migrate(db, {
    migrationsFolder: process.env.WIKI_MIGRATIONS_DIR || path.join(process.cwd(), 'drizzle'),
    migrationsSchema: 'public',
    migrationsTable: 'wiki_migrations',
  });
}

export async function database(): Promise<Database> {
  const g = globalThis as Global;
  const db = getDb();

  if (!g.__fasberryWikiReady) {
    g.__fasberryWikiReady = runMigrations(db).catch((error) => {
      g.__fasberryWikiReady = undefined;
      throw error;
    });
  }

  await g.__fasberryWikiReady;
  return db;
}
