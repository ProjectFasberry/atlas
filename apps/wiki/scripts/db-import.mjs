#!/usr/bin/env node
/**
 * Import content into PostgreSQL.
 *
 *   pnpm db:import          # from content/docs/*.mdx, otherwise from content/seed.json
 *   pnpm db:import --force  # also overwrites pages edited in the editor
 *
 * content/docs exists only for the one-off migration of old MDX. The main sources are
 * content/seed.json (a database snapshot) and the backend sync (`pnpm sync:wiki`).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import { wikiPages } from '../lib/db/schema.ts';
import { htmlToMarkdown, jsxToHtml } from './lib/content.mjs';
import { DEFAULT_SERVER, openDb, upsertPage } from './lib/db.mjs';

const CONTENT = path.join(process.cwd(), 'content/docs');
const SEED = path.join(process.cwd(), 'content/seed.json');
const force = process.argv.includes('--force');

function parseFrontmatter(raw) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;

    let value = kv[2].trim();
    if (value.startsWith('"')) {
      try {
        value = JSON.parse(value);
      } catch {
        value = value.slice(1, -1);
      }
    } else if (value.startsWith("'")) {
      value = value.slice(1, -1);
    }
    data[kv[1]] = value;
  }

  return { data, body: raw.slice(match[0].length) };
}

async function importSeed(db, existing) {
  const raw = await fs.readFile(SEED, 'utf8').catch(() => null);
  if (!raw) {
    console.error('Нет ни content/docs, ни content/seed.json - импортировать нечего.');
    console.error('Заполните базу через `pnpm sync:wiki`.');
    process.exitCode = 1;
    return;
  }

  const seed = JSON.parse(raw);
  let imported = 0;

  for (const page of seed.pages ?? []) {
    const server = page.server || DEFAULT_SERVER;
    if (!force && existing.get(`${server}|${page.slug}`) === 'editor') {
      console.log(`· ${server}/${page.slug || '/'} - есть правки из редактора, пропускаю`);
      continue;
    }

    await upsertPage(db, { ...page, source: page.source || 'seed' });
    imported += 1;
  }

  console.log(`Импортировано из снимка: ${imported}`);
}

async function main() {
  const { client, db } = await openDb();
  const existing = new Map(
    (
      await db
        .select({ server: wikiPages.server, slug: wikiPages.slug, source: wikiPages.source })
        .from(wikiPages)
    ).map((row) => [`${row.server}|${row.slug}`, row.source]),
  );

  const files = (await fs.readdir(CONTENT).catch(() => [])).filter((file) => file.endsWith('.mdx'));

  if (files.length === 0) {
    await importSeed(db, existing);
    await client.end();
    return;
  }

  const meta = await fs
    .readFile(path.join(CONTENT, 'meta.json'), 'utf8')
    .then((raw) => JSON.parse(raw))
    .catch(() => ({ pages: [] }));

  const order = [];
  let section = null;
  let position = 0;

  for (const entry of meta.pages ?? []) {
    const group = /^---(.+)---$/.exec(entry);
    if (group) {
      section = group[1];
      continue;
    }
    order.push({ slug: entry, section, position: ++position });
  }

  const seen = new Set(order.map((item) => item.slug));
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    if (seen.has(slug)) continue;

    order.push({ slug, section: null, position: ++position });
    seen.add(slug);
  }

  let imported = 0;
  let skipped = 0;

  for (const item of order) {
    const file = path.join(CONTENT, `${item.slug}.mdx`);
    const raw = await fs.readFile(file, 'utf8').catch(() => null);
    if (!raw) continue;

    const slug = item.slug === 'index' ? '' : item.slug;

    if (!force && existing.get(`${DEFAULT_SERVER}|${slug}`) === 'editor') {
      console.log(`· ${slug || '/'} - есть правки из редактора, пропускаю`);
      skipped += 1;
      continue;
    }

    const { data, body } = parseFrontmatter(raw);
    const html = jsxToHtml(String(await marked.parse(body)));

    await upsertPage(db, {
      server: DEFAULT_SERVER,
      slug,
      title: data.title || slug || 'Fasberry Wiki',
      description: data.description || '',
      html,
      markdown: htmlToMarkdown(html),
      section: slug === '' ? null : item.section,
      position: slug === '' ? 0 : item.position,
      source: 'mdx',
      updatedAt: new Date().toISOString(),
      updatedBy: null,
    });

    imported += 1;
    console.log(`✓ ${slug || '/'} — ${data.title || slug}`);
  }

  console.log(`\nИмпортировано: ${imported}, пропущено: ${skipped}`);
  await client.end();
  console.log('База: PostgreSQL (DATABASE_URL)');
}

await main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
