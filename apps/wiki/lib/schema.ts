import { sql } from 'drizzle-orm';
import { bigint, customType, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/** PostgreSQL bytea: drizzle has no built-in column type for it. */
const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

/**
 * Wiki content. Tables are prefixed with `wiki_` so the database can be shared
 * with other Fasberry services. Migrations live in `drizzle/` and are applied by
 * `lib/db.ts` on start, so this file is the single source of truth.
 */
export const wikiPages = pgTable(
  'wiki_pages',
  {
    slug: text('slug').primaryKey(),
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
    index('wiki_pages_order_idx').on(table.position, table.slug),
    index('wiki_pages_section_idx').on(table.section, table.position),
  ],
);

export const wikiRevisions = pgTable(
  'wiki_revisions',
  {
    id: bigint('id', { mode: 'number' }).generatedAlwaysAsIdentity().primaryKey(),
    slug: text('slug')
      .notNull()
      .references(() => wikiPages.slug, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull().default(''),
    html: text('html').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().default(sql`now()`),
    author: text('author'),
  },
  (table) => [index('wiki_revisions_slug_idx').on(table.slug, table.createdAt)],
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
