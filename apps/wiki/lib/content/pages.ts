import { and, asc, eq } from 'drizzle-orm';
import type { Root } from 'fumadocs-core/page-tree';
import { sanitizeContent, stripHtml, toMarkdown, withHeadingIds } from '@/lib/content/html';
import {
  DEFAULT_SERVER,
  pageUrl as serverPageUrl,
} from '@/lib/content/servers';
import { getSource } from '@/lib/content/source';
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

export function pageUrl(server: string, slug: string) {
  return serverPageUrl(server, slug);
}

export async function listPages(server: string = DEFAULT_SERVER): Promise<WikiPage[]> {
  const db = await database();
  return db
    .select()
    .from(wikiPages)
    .where(eq(wikiPages.server, server))
    .orderBy(asc(wikiPages.position), asc(wikiPages.slug));
}

/** Slugs of every page per server: the switcher keeps the current article when it exists. */
export async function listServerSlugs(): Promise<Record<string, string[]>> {
  const db = await database();
  const rows = await db
    .select({ server: wikiPages.server, slug: wikiPages.slug })
    .from(wikiPages)
    .orderBy(asc(wikiPages.position), asc(wikiPages.slug));

  const result: Record<string, string[]> = {};
  for (const row of rows) (result[row.server] ??= []).push(row.slug);
  return result;
}

export async function getPage(
  server: string = DEFAULT_SERVER,
  slug: string,
): Promise<WikiPage | null> {
  const db = await database();
  const [row] = await db
    .select()
    .from(wikiPages)
    .where(and(eq(wikiPages.server, server), eq(wikiPages.slug, slug)))
    .limit(1);
  return row ?? null;
}

/**
 * Page in the requested locale: the stored translation when it is still up to date,
 * the Russian original otherwise.
 */
export async function getLocalizedPage(
  server: string = DEFAULT_SERVER,
  slug: string,
  locale?: string,
): Promise<WikiPage | null> {
  const page = await getPage(server, slug);
  if (!page || !locale || !isTranslationLocale(locale)) return page;

  const translation = await getTranslation(server, page.slug, locale);
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
export async function listLocalizedPages(
  server: string = DEFAULT_SERVER,
  locale?: string,
): Promise<WikiPage[]> {
  const pages = await listPages(server);
  if (!locale || !isTranslationLocale(locale)) return pages;

  const db = await database();
  const translations = await db
    .select()
    .from(wikiPageTranslations)
    .where(
      and(eq(wikiPageTranslations.server, server), eq(wikiPageTranslations.locale, locale)),
    );
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

/** Public URL for the page on its server, the default server has no prefix. */
function treeUrl(server: string, url: string) {
  if (server === DEFAULT_SERVER) return url;
  return url === '/' ? `/${server}` : `/${server}${url}`;
}

/** The sidebar tree comes from the fumadocs source, which reads the same rows. */
export async function getPageTree(
  server: string = DEFAULT_SERVER,
  locale?: string,
): Promise<Root> {
  const tree = (await getSource(server).get()).pageTree as Root;
  const localized = locale && locale !== 'ru' ? await localizedNames(server, locale) : null;

  return {
    ...tree,
    children: tree.children.map((node) => {
      if (node.type === 'separator') {
        const name = typeof node.name === 'string' ? node.name : '';
        const translated = localized?.sections.get(name);
        return { ...node, name: translated ?? node.name };
      }

      if (node.type === 'page') {
        const slug = node.url === '/' ? '' : node.url.replace(/^\//, '');
        const translated = localized?.titles.get(slug);
        return {
          ...node,
          name: translated ?? node.name,
          url: treeUrl(server, node.url),
        };
      }

      if (node.type === 'folder') {
        return {
          ...node,
          children: node.children.map((child) =>
            child.type === 'page' ? { ...child, url: treeUrl(server, child.url) } : child,
          ),
          ...(node.index ? { index: { ...node.index, url: treeUrl(server, node.index.url) } } : {}),
        };
      }

      return node;
    }),
  };
}

/** Sidebar titles of the reading locale, pages and group separators. */
async function localizedNames(server: string, locale: string) {
  const db = await database();
  const [titles, sections] = await Promise.all([
    db
      .select({ title: wikiPageTranslations.title, slug: wikiPageTranslations.slug })
      .from(wikiPageTranslations)
      .where(
        and(
          eq(wikiPageTranslations.server, server),
          eq(wikiPageTranslations.locale, locale),
        ),
      ),
    db
      .select({ section: wikiSectionTranslations.section, title: wikiSectionTranslations.title })
      .from(wikiSectionTranslations)
      .where(eq(wikiSectionTranslations.locale, locale)),
  ]);

  return {
    titles: new Map(titles.map((row) => [row.slug, row.title.trim()])),
    sections: new Map(sections.map((row) => [row.section, row.title.trim()])),
  };
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
  server: string,
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
      .where(and(eq(wikiPages.server, server), eq(wikiPages.slug, slug)))
      .returning();

    if (!updated) return null;

    await tx.insert(wikiRevisions).values({
      server,
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
