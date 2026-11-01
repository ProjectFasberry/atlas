import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { database } from './db';
import { sanitizeContent, toMarkdown } from './html';
import { http } from './http';
import { type WikiPage, wikiPageTranslations } from './schema';

/** Self-hosted LibreTranslate on the same docker network. */
const ENDPOINT = process.env.TRANSLATE_URL || 'http://translate:5000';
const TIMEOUT = 60_000;

/** Locales the content is machine translated into. Russian is the source. */
export const TRANSLATION_LOCALES = ['en'] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

export function isTranslationLocale(value: string): value is TranslationLocale {
  return (TRANSLATION_LOCALES as readonly string[]).includes(value);
}

/** Changes when the Russian page changes, so a translation can be marked stale. */
export function sourceHash(page: Pick<WikiPage, 'title' | 'description' | 'html'>) {
  return createHash('sha256')
    .update(`${page.title}\n${page.description}\n${page.html}`)
    .digest('hex')
    .slice(0, 32);
}

type TranslateResponse = { translatedText: string };

async function translate(text: string, format: 'text' | 'html'): Promise<string> {
  if (!text.trim()) return text;

  const response = await http.post(`${ENDPOINT}/translate`, {
    json: { q: text, source: 'ru', target: 'en', format },
    timeout: TIMEOUT,
  });

  if (!response.ok) {
    throw new Error(`translate ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as TranslateResponse;
  return body.translatedText;
}

export async function getTranslation(slug: string, locale: TranslationLocale) {
  const db = await database();
  const [row] = await db
    .select()
    .from(wikiPageTranslations)
    .where(and(eq(wikiPageTranslations.slug, slug), eq(wikiPageTranslations.locale, locale)))
    .limit(1);

  return row ?? null;
}

export type TranslationState = 'fresh' | 'missing' | 'stale';

/** Whether the stored translation still matches the Russian page. */
export async function translationState(
  page: WikiPage,
  locale: TranslationLocale | undefined,
): Promise<TranslationState> {
  if (!locale) return 'fresh';

  const row = await getTranslation(page.slug, locale);
  if (!row) return 'missing';

  return row.sourceHash === sourceHash(page) ? 'fresh' : 'stale';
}

/**
 * Translates the page and stores the result. LibreTranslate has no batching and no
 * tag-aware mode switch per string, so the HTML goes as `format=html`, the plain
 * fields as `format=text`; markdown is rebuilt from the translated HTML.
 */
export async function translatePage(page: WikiPage, locale: TranslationLocale) {
  const title = await translate(page.title, 'text');
  const description = page.description ? await translate(page.description, 'text') : '';
  const html = sanitizeContent(await translate(page.html, 'html'));
  const markdown = toMarkdown(html);

  const db = await database();

  await db
    .insert(wikiPageTranslations)
    .values({
      slug: page.slug,
      locale,
      title,
      description,
      html,
      markdown,
      sourceHash: sourceHash(page),
      engine: 'libretranslate',
      translatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [wikiPageTranslations.slug, wikiPageTranslations.locale],
      set: {
        title,
        description,
        html,
        markdown,
        sourceHash: sourceHash(page),
        engine: 'libretranslate',
        translatedAt: new Date(),
      },
    });
}
