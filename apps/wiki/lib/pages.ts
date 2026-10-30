import { asc, eq } from 'drizzle-orm';
import type { Root } from 'fumadocs-core/page-tree';
import TurndownService from 'turndown';
import { database } from './db';
import { sanitizeContent, stripHtml, withHeadingIds } from './html';
import { type WikiPage, wikiPages, wikiRevisions } from './schema';
import { source } from './source';

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
});

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

/** The sidebar tree comes from the fumadocs source, which reads the same rows. */
export async function getPageTree(): Promise<Root> {
  return (await source.get()).pageTree;
}

/** Markdown of a page, used by the llms endpoints. */
export async function getPageMarkdown(slugs: string[]): Promise<string | null> {
  const page = await getPage(slugs.join('/'));
  return page?.markdown ?? null;
}

export function renderPageHtml(page: PageRow) {
  return withHeadingIds(page.html);
}

export function toMarkdown(html: string) {
  return turndown.turndown(html).trim();
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
