import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { database } from '@/lib/db';
import { type WikiPage, wikiPageTranslations } from '@/lib/db/schema';

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

export async function getTranslation(
  server: string,
  slug: string,
  locale: TranslationLocale,
) {
  const db = await database();
  const [row] = await db
    .select()
    .from(wikiPageTranslations)
    .where(
      and(
        eq(wikiPageTranslations.server, server),
        eq(wikiPageTranslations.slug, slug),
        eq(wikiPageTranslations.locale, locale),
      ),
    )
    .limit(1);

  return row ?? null;
}
