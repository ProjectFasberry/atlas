import path from 'node:path';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import * as schema from '@/lib/db/schema';
import { getServerEnv } from '@/lib/env/server';

export type Database = NodePgDatabase<typeof schema>;

type Global = typeof globalThis & {
  __fasberryWikiPool?: pg.Pool;
  __fasberryWikiDb?: Database;
  __fasberryWikiReady?: Promise<void>;
};

/**
 * Connection settings come from DATABASE_URL, or from the standard PG* variables
 * (PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE) when the password cannot be put
 * into a URI without escaping. Both come validated from `lib/env/server`.
 */
export function connectionConfig(): pg.PoolConfig {
  return getServerEnv().database;
}

export function getPool() {
  const g = globalThis as Global;
  if (g.__fasberryWikiPool) return g.__fasberryWikiPool;

  const pool = new pg.Pool({
    ...connectionConfig(),
    max: getServerEnv().poolMax,
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
    migrationsFolder: getServerEnv().migrationsDir ?? path.join(process.cwd(), 'drizzle'),
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
