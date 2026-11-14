import { sql } from 'drizzle-orm';
import {
  bigint,
  customType,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

/** PostgreSQL bytea: drizzle has no built-in column type for it. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/**
 * Wiki content, one page per server. Tables are prefixed with `wiki_` so the
 * database can be shared with other Fasberry services. Migrations live in
 * `drizzle/` and are applied by `lib/db/index.ts` on start, so this file is the
 * single source of truth.
 *
 * The default server is repeated as a literal here and in the scripts: this file
 * is loaded by Node directly (type stripping), which does not resolve extensionless
 * relative imports. `lib/content/default-server.ts` is the app-side source and must
 * keep the same value (`bisquite`).
 */
export const wikiPages = pgTable(
  'wiki_pages',
  {
    server: text('server').notNull().default('bisquite'),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    html: text('html').notNull().default(''),
    markdown: text('markdown').notNull().default(''),
    section: text('section'),
    position: integer('position').notNull().default(0),
    source: text('source').notNull().default('editor'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text('updated_by'),
  },
  (table) => [
    primaryKey({ columns: [table.server, table.slug] }),
    index('wiki_pages_order_idx').on(table.server, table.position, table.slug),
    index('wiki_pages_section_idx').on(table.server, table.section, table.position),
  ],
);

export const wikiRevisions = pgTable(
  'wiki_revisions',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    server: text('server').notNull().default('bisquite'),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    html: text('html').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    author: text('author'),
  },
  (table) => [
    index('wiki_revisions_slug_idx').on(table.server, table.slug, table.createdAt),
    foreignKey({
      columns: [table.server, table.slug],
      foreignColumns: [wikiPages.server, wikiPages.slug],
    }).onDelete('cascade'),
  ],
);

export const wikiImages = pgTable('wiki_images', {
  id: text('id').primaryKey(),
  mime: text('mime').notNull(),
  data: bytea('data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type WikiPage = typeof wikiPages.$inferSelect;
export type WikiPageInsert = typeof wikiPages.$inferInsert;
export type WikiRevisionInsert = typeof wikiRevisions.$inferInsert;
export type WikiImage = typeof wikiImages.$inferSelect;

/**
 * Machine translations of a page, one row per locale. The Russian page stays the
 * source of truth; `source_hash` marks a translation as stale after an edit.
 */
export const wikiPageTranslations = pgTable(
  'wiki_page_translations',
  {
    server: text('server').notNull().default('bisquite'),
    slug: text('slug').notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    html: text('html').notNull(),
    markdown: text('markdown').notNull().default(''),
    sourceHash: text('source_hash').notNull(),
    engine: text('engine').notNull().default('deepl'),
    translatedAt: timestamp('translated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.server, table.slug, table.locale] }),
    foreignKey({
      columns: [table.server, table.slug],
      foreignColumns: [wikiPages.server, wikiPages.slug],
    }).onDelete('cascade'),
  ],
);

export type WikiPageTranslation = typeof wikiPageTranslations.$inferSelect;

/** Sidebar group names translated once per locale. */
export const wikiSectionTranslations = pgTable(
  'wiki_section_translations',
  {
    section: text('section').notNull(),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    translatedAt: timestamp('translated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.section, table.locale] })],
);
