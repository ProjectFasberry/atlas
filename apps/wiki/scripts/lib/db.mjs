import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../../lib/db/schema.ts';

/** Must match `lib/content/default-server.ts` and the schema default. */
export const DEFAULT_SERVER = 'bisquite';

export const ROOT = process.cwd();

/** DATABASE_URL, or the standard PG* variables when the password needs no URI escaping. */
export function connectionConfig() {
  const url = process.env.DATABASE_URL || process.env.WIKI_DATABASE_URL;
  if (url) return { connectionString: url };
  if (process.env.PGHOST && process.env.PGUSER && process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
    };
  }
  throw new Error('DATABASE_URL or PG* variables are not set');
}

/** One connection plus a drizzle instance over it; the caller closes `client`. */
export async function openDb() {
  const client = new pg.Client({
    ...connectionConfig(),
    application_name: 'fasberry-wiki-scripts',
  });
  await client.connect();
  return { client, db: drizzle(client, { schema }) };
}

export async function upsertPage(db, page) {
  const values = {
    server: page.server ?? DEFAULT_SERVER,
    slug: page.slug,
    title: page.title,
    description: page.description ?? '',
    html: page.html ?? '',
    markdown: page.markdown ?? '',
    section: page.section ?? null,
    position: page.position ?? 0,
    source: page.source ?? 'sync',
    updatedAt: new Date(page.updatedAt ?? Date.now()),
    updatedBy: page.updatedBy ?? null,
  };

  await db
    .insert(schema.wikiPages)
    .values(values)
    .onConflictDoUpdate({
      target: [schema.wikiPages.server, schema.wikiPages.slug],
      set: {
        title: values.title,
        description: values.description,
        html: values.html,
        markdown: values.markdown,
        section: values.section,
        position: values.position,
        source: values.source,
        updatedAt: values.updatedAt,
        updatedBy: values.updatedBy,
      },
    });
}
