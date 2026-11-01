#!/usr/bin/env node
/**
 * Fills `wiki_page_translations` with machine translations of the Russian pages.
 *
 *   DATABASE_URL=... node scripts/translate-content.mjs [--slug armor] [--force]
 *
 * The provider is MyMemory: free, no key, but it caps a request at 500 bytes, so
 * every text node of the article HTML is translated separately and the markup is
 * reassembled as is. Existing translations are skipped unless the russian page
 * changed (source hash) or `--force` is passed.
 */
import crypto from 'node:crypto';
import pg from 'pg';
import sanitizeHtml from 'sanitize-html';
import Turndown from 'turndown';

const API = 'https://api.mymemory.translated.net/get';
const LIMIT = 480;
const LOCALE = 'en';

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;

const turndown = new Turndown({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

const hashOf = (page) =>
  crypto
    .createHash('sha256')
    .update(`${page.title}\n${page.description}\n${page.html}`)
    .digest('hex')
    .slice(0, 32);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(text) {
  const url = `${API}?q=${encodeURIComponent(text)}&langpair=ru%7Cen`;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch(() => null);
    if (response?.ok) {
      const body = await response.json();
      const value = body?.responseData?.translatedText;
      if (typeof value === 'string' && value.length > 0 && !/MYMEMORY WARNING/i.test(value)) {
        return value;
      }
    }

    await sleep(500 * attempt);
  }

  return text;
}

/** Splits html into tags and text; only text pieces go to the translator. */
async function translateHtml(html) {
  const parts = html.split(/(<[^>]+>)/);
  const out = [];

  for (const part of parts) {
    if (part.startsWith('<') || part.trim().length < 2) {
      out.push(part);
      continue;
    }

    let text = part;
    if (Buffer.byteLength(text, 'utf8') > LIMIT) {
      // long text node: fall back to sentence chunks
      const sentences = text.split(/(?<=[.!?])\s+/);
      const pieces = [];
      let buffer = '';

      for (const sentence of sentences) {
        if (Buffer.byteLength(buffer + sentence, 'utf8') > LIMIT && buffer) {
          pieces.push(buffer);
          buffer = '';
        }
        buffer += sentence;
      }
      if (buffer) pieces.push(buffer);

      const translated = [];
      for (const piece of pieces) translated.push(await request(piece));
      text = translated.join(' ');
    } else {
      text = await request(text);
    }

    // keep the surrounding whitespace of the original node
    const lead = part.match(/^\s*/)[0];
    const tail = part.match(/\s*$/)[0];
    out.push(`${lead}${text.trim()}${tail}`);
    await sleep(80);
  }

  return out.join('');
}

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || process.env.WIKI_DATABASE_URL,
  });
  await client.connect();

  const { rows: pages } = await client.query(
    'select slug, title, description, html from wiki_pages order by position, slug',
  );
  const { rows: existing } = await client.query(
    'select slug, locale, source_hash from wiki_page_translations',
  );
  const known = new Map(existing.map((row) => [`${row.slug}|${row.locale}`, row.source_hash]));

  let done = 0;
  let skipped = 0;

  for (const page of pages) {
    if (slugArg && page.slug !== slugArg) continue;

    const hash = hashOf(page);
    if (!force && known.get(`${page.slug}|${LOCALE}`) === hash) {
      skipped += 1;
      continue;
    }

    process.stdout.write(`· ${page.slug || '/'} ... `);

    const title = await request(page.title);
    const description = page.description ? await request(page.description) : '';
    const html = sanitizeHtml(await translateHtml(page.html));
    const markdown = turndown.turndown(html).trim();

    await client.query(
      `insert into wiki_page_translations
         (slug, locale, title, description, html, markdown, source_hash, engine, translated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, now())
       on conflict (slug, locale) do update set
         title = excluded.title,
         description = excluded.description,
         html = excluded.html,
         markdown = excluded.markdown,
         source_hash = excluded.source_hash,
         engine = excluded.engine,
         translated_at = now()`,
      [page.slug, LOCALE, title, description, html, markdown, hash, 'mymemory'],
    );

    done += 1;
    console.log('ok');
  }

  const { rows: sections } = await client.query(
    'select distinct section from wiki_pages where section is not null order by section',
  );
  const { rows: sectionRows } = await client.query(
    'select section from wiki_section_translations where locale = $1',
    [LOCALE],
  );
  const knownSections = new Set(sectionRows.map((row) => row.section));

  let translatedSections = 0;
  for (const { section } of sections) {
    if (!force && knownSections.has(section)) continue;

    process.stdout.write(`· [section] ${section} ... `);
    const title = await request(section);
    await client.query(
      `insert into wiki_section_translations (section, locale, title, translated_at)
       values ($1, $2, $3, now())
       on conflict (section, locale) do update set title = excluded.title, translated_at = now()`,
      [section, LOCALE, title],
    );
    translatedSections += 1;
    console.log('ok');
  }

  console.log(`\ntranslated: ${done}, skipped: ${skipped}, sections: ${translatedSections}`);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
