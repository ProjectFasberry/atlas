import { createHash } from 'node:crypto';
import pg from 'pg';

/**
 * Fixtures for e2e: a couple of pages in the shape the app stores them, one page with a
 * fresh English translation. Every row is upserted, so the seed can run on a dirty e2e
 * database and a stale fixture never breaks the run.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required');
if (!/e2e/i.test(connectionString)) {
  throw new Error('DATABASE_URL must point to the e2e database, not to a real one');
}

const sourceHash = (title, description, html) =>
  createHash('sha256').update(`${title}\n${description}\n${html}`).digest('hex').slice(0, 32);

const PAGES = [
  {
    slug: '',
    title: 'E2E Обзор',
    description: 'Обзор вики для e2e',
    section: null,
    position: 0,
    html: '<h2>E2E Обзор</h2><p>Стартовая страница для e2e.</p>',
    markdown: '## E2E Обзор\n\nСтартовая страница для e2e.',
  },
  {
    slug: 'armor',
    title: 'E2E Броня',
    description: 'Про броню',
    section: 'Аспекты игры',
    position: 1,
    html: '<h2>E2E Броня</h2><p>Есть пять новых видов брони.</p>',
    markdown: '## E2E Броня\n\nЕсть пять новых видов брони.',
  },
  {
    slug: 'mobs',
    title: 'E2E Мобы',
    description: 'Про мобов',
    section: 'Аспекты игры',
    position: 2,
    html: '<h2>E2E Мобы</h2><p>Мобы встречаются в разных биомах.</p>',
    markdown: '## E2E Мобы\n\nМобы встречаются в разных биомах.',
  },
];

const client = new pg.Client({ connectionString });
await client.connect();

try {
  for (const page of PAGES) {
    await client.query(
      `insert into wiki_pages (slug, title, description, html, markdown, section, position, source, updated_at, updated_by)
       values ($1, $2, $3, $4, $5, $6, $7, 'seed', now(), 'e2e')
       on conflict (slug) do update set
         title = excluded.title,
         description = excluded.description,
         html = excluded.html,
         markdown = excluded.markdown,
         section = excluded.section,
         position = excluded.position,
         source = excluded.source,
         updated_at = now(),
         updated_by = excluded.updated_by`,
      [page.slug, page.title, page.description, page.html, page.markdown, page.section, page.position],
    );
  }

  // the armor page has a fresh English translation, the rest stays Russian
  const armor = PAGES.find((page) => page.slug === 'armor');
  await client.query(
    `insert into wiki_page_translations (slug, locale, title, description, html, markdown, source_hash, engine, translated_at)
     values ('armor', 'en', $1, $2, $3, '', $4, 'e2e', now())
     on conflict (slug, locale) do update set
       title = excluded.title,
       description = excluded.description,
       html = excluded.html,
       source_hash = excluded.source_hash,
       translated_at = now()`,
    [
      'E2E Armour',
      'About the armour',
      '<h2>E2E Armour</h2><p>There are five new kinds of armour.</p>',
      sourceHash(armor.title, armor.description, armor.html),
    ],
  );

  await client.query(
    `insert into wiki_section_translations (section, locale, title, translated_at)
     values ('Аспекты игры', 'en', 'Game aspects', now())
     on conflict (section, locale) do update set title = excluded.title, translated_at = now()`,
  );

  console.log(`seeded ${PAGES.length} pages`);
} finally {
  await client.end();
}
