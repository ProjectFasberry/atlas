import { asc, eq } from 'drizzle-orm';
import type { Root } from 'fumadocs-core/page-tree';
import { sanitizeContent, stripHtml, toMarkdown, withHeadingIds } from '@/lib/content/html';
import { source } from '@/lib/content/source';
import { database } from '@/lib/db';
import {
  type WikiPage,
  wikiPages,
  wikiPageTranslations,
  wikiRevisions,
  wikiSectionTranslations,
} from '@/lib/db/schema';
import { getTranslation, isTranslationLocale, sourceHash } from '@/lib/i18n/translations';

export type PageRow = WikiPage;

export function pageUrl(slug: string) {
  return slug ? `/${slug}` : '/';
}

export async function listPages(): Promise<WikiPage[]> {
  const db = await database();
  return db.select().from(wikiPages).orderBy(asc(wikiPages.position), asc(wikiPages.slug));
}

export async function getPage(slug: string): Promise<WikiPage | null> {
  const db = await database();
  const [row] = await db.select().from(wikiPages).where(eq(wikiPages.slug, slug)).limit(1);
  return row ?? null;
}

/**
 * Page in the requested locale: the stored translation when it is still up to date,
 * the Russian original otherwise.
 */
export async function getLocalizedPage(slug: string, locale?: string): Promise<WikiPage | null> {
  const page = await getPage(slug);
  if (!page || !locale || !isTranslationLocale(locale)) return page;

  const translation = await getTranslation(page.slug, locale);
  if (!translation || translation.sourceHash !== sourceHash(page)) return page;

  return {
    ...page,
    title: translation.title,
    description: translation.description,
    html: translation.html,
    markdown: translation.markdown,
  };
}

/**
 * Every page in the requested locale: the same freshness rule as `getLocalizedPage`,
 * but one query for all translations, so the search index does not go page by page.
 */
export async function listLocalizedPages(locale?: string): Promise<WikiPage[]> {
  const pages = await listPages();
  if (!locale || !isTranslationLocale(locale)) return pages;

  const db = await database();
  const translations = await db
    .select()
    .from(wikiPageTranslations)
    .where(eq(wikiPageTranslations.locale, locale));
  const bySlug = new Map(translations.map((row) => [row.slug, row]));

  return pages.map((page) => {
    const translation = bySlug.get(page.slug);
    if (!translation || translation.sourceHash !== sourceHash(page)) return page;

    return {
      ...page,
      title: translation.title.trim(),
      description: translation.description.trim(),
      html: translation.html,
      markdown: translation.markdown,
    };
  });
}

/** The sidebar tree comes from the fumadocs source, which reads the same rows. */
export async function getPageTree(locale?: string): Promise<Root> {
  const tree = (await source.get()).pageTree;
  if (!locale || locale === 'ru') return tree;

  const db = await database();
  const [titles, sections] = await Promise.all([
    db
      .select({ slug: wikiPageTranslations.slug, title: wikiPageTranslations.title })
      .from(wikiPageTranslations)
      .where(eq(wikiPageTranslations.locale, locale)),
    db
      .select({ section: wikiSectionTranslations.section, title: wikiSectionTranslations.title })
      .from(wikiSectionTranslations)
      .where(eq(wikiSectionTranslations.locale, locale)),
  ]);

  const titleBySlug = new Map(titles.map((row) => [row.slug, row.title.trim()]));
  const titleBySection = new Map(sections.map((row) => [row.section, row.title.trim()]));

  const children = tree.children.map((node) => {
    if (node.type === 'separator') {
      const name = typeof node.name === 'string' ? node.name : '';
      const translated = titleBySection.get(name);
      return translated ? { ...node, name: translated } : node;
    }

    if (node.type === 'page') {
      const slug = node.url === '/' ? '' : node.url.replace(/^\//, '');
      const translated = titleBySlug.get(slug);
      return translated ? { ...node, name: translated } : node;
    }

    return node;
  });

  return { ...tree, children };
}

export function renderPageHtml(page: PageRow) {
  return withHeadingIds(page.html);
}

export type PageInput = {
  title: string;
  description: string;
  html: string;
};

/**
 * Updates the page and appends a revision in one transaction, so a failed insert
 * never leaves the page changed without history.
 */
export async function savePage(
  slug: string,
  input: PageInput,
  author: string,
): Promise<WikiPage | null> {
  const db = await database();
  const html = sanitizeContent(input.html);
  const markdown = toMarkdown(html);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(wikiPages)
      .set({
        title: input.title,
        description: input.description,
        html,
        markdown,
        source: 'editor',
        updatedAt: now,
        updatedBy: author,
      })
      .where(eq(wikiPages.slug, slug))
      .returning();

    if (!updated) return null;

    await tx.insert(wikiRevisions).values({
      slug,
      title: input.title,
      description: input.description,
      html,
      createdAt: now,
      author,
    });

    return updated;
  });
}

export function pagePlainText(page: PageRow) {
  return stripHtml(page.html);
}

/** Meta description: the stored one, otherwise the first characters of the text. */
export function pageDescription(page: PageRow, limit = 160) {
  const text = page.description?.trim() || pagePlainText(page);
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}...` : text;
}
