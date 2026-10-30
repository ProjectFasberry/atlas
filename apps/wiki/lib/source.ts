import { asc } from 'drizzle-orm';
import { dynamicLoader } from 'fumadocs-core/source';
import { pageIcon, sectionIcon } from '@/shared/ui/page-icons';
import { database } from './db';
import { wikiPages } from './schema';

/**
 * Fumadocs source over the database: virtual files are built from `wiki_pages`,
 * so the page tree, breadcrumbs and llms.txt come from the library instead of
 * hand-written code. The tree is cached for a second, which keeps `sync:wiki`
 * and editor saves visible without a restart.
 */
export const source = dynamicLoader(
  {
    cache: 'memory',
    staleTime: 1000,
    files: async () => {
      const db = await database();
      const rows = await db
        .select({
          slug: wikiPages.slug,
          title: wikiPages.title,
          description: wikiPages.description,
          section: wikiPages.section,
        })
        .from(wikiPages)
        .orderBy(asc(wikiPages.position), asc(wikiPages.slug));

      const files: {
        type: 'page' | 'meta';
        path: string;
        slugs?: string[];
        data: {
          title?: string;
          description?: string;
          icon?: string;
          pages?: string[];
        };
      }[] = [];
      const meta: string[] = [];
      let current: string | null = null;

      for (const row of rows) {
        const isRoot = row.slug === '';
        // a meta entry addresses the first path segment of the page
        const name = isRoot ? 'index' : row.slug.split('/')[0];

        files.push({
          type: 'page',
          path: `${name}.mdx`,
          slugs: row.slug ? row.slug.split('/') : [],
          data: { title: row.title, description: row.description, icon: row.slug },
        });

        if (isRoot) {
          meta.push(name);
          continue;
        }

        if (row.section && row.section !== current) {
          current = row.section;
          meta.push(`---${row.section}---`);
        }
        meta.push(name);
      }

      files.push({
        type: 'meta',
        path: 'meta.json',
        data: { title: 'Fasberry Wiki', pages: meta },
      });
      return files;
    },
  },
  {
    baseUrl: '/',
    // page icons are keyed by slug, group icons by a `section:` prefix
    icon: (name) =>
      name?.startsWith('section:')
        ? sectionIcon(name.slice('section:'.length))
        : pageIcon(name ?? ''),
    pageTree: {
      transformers: [
        // group headings keep their icon, the page tree itself has none for separators
        {
          separator: (node) => ({
            ...node,
            icon: typeof node.name === 'string' ? `section:${node.name}` : undefined,
          }),
        },
      ],
    },
  },
);
