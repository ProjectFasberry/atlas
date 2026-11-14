#!/usr/bin/env node
/**
 * A snapshot of the content from PostgreSQL into content/seed.json.
 *
 *   pnpm db:export
 *
 * Needed so the wiki can be bootstrapped from scratch without the backend: `pnpm db:import`
 * reads this file when there is no content/docs next to it. Images uploaded through the
 * editor (wiki_images) do not go into the snapshot - a full backup is a pg_dump.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { asc } from 'drizzle-orm';
import { wikiPages } from '../lib/db/schema.ts';
import { openDb } from './lib/db.mjs';

async function main() {
  const { client, db } = await openDb();
  const pages = await db
    .select()
    .from(wikiPages)
    .orderBy(asc(wikiPages.server), asc(wikiPages.position), asc(wikiPages.slug));
  await client.end();

  const target = path.join(process.cwd(), 'content/seed.json');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(
    target,
    `${JSON.stringify({ exportedAt: new Date().toISOString(), pages }, null, 2)}\n`,
    'utf8',
  );

  console.log(`Страниц: ${pages.length}`);
  console.log(`Снимок: ${path.relative(process.cwd(), target)}`);
}

await main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
