# Project map for agents

Fasberry wiki: Next.js 16 (App Router) + Fumadocs UI, content in PostgreSQL, editor built on TipTap,
state on Reatom v3. It lives at `https://wiki.fasberry.fun`, the wiki sits at the domain root
(`/` is the overview, `/<slug>` is an article, a slug may have several segments).

This directory is the entry point. Read in order:

| File | About |
| --- | --- |
| `architecture.md` | Routes, rendering, data flow, `proxy.ts`, `next.config.mjs`, llms/og |
| `data.md` | Drizzle schema and migrations, `lib/db.ts`, `sync:wiki` / `db:import` / `db:export`, environment variables |
| `editor.md` | Inline editor: `shared/components/wiki/wiki-page.tsx`, the Reatom model, save and upload APIs |
| `ui.md` | Theme and circle animation, 80px header, favicons, palette, `app/global.css` |
| `conventions.md` | Code style, Reatom v3 rules, pitfalls, deploy and preview |

## Repository layout

```
app/
  layout.tsx                 root layout: metadata/favicons, inline theme script,
                             RootProvider (Fumadocs theme disabled), DocsLayout, "Editor" chip
  global.css                 Tailwind + Fumadocs + palette, header, theme animation block, typography
  [[...slug]]/page.tsx       article page (SSR from PostgreSQL) + generateMetadata
  api/
    wiki/pages/[[...slug]]/route.ts  PUT - save an article + a revision
    wiki/upload/route.ts             POST - store an image in the images table
    images/[id]/route.ts             GET - serve an image from the database
    search/route.ts                  GET - page search (Fumadocs search API)
  llms.txt/route.ts          list of pages for LLMs
  llms-full.txt/route.ts     all pages as one text
  llms.mdx/docs/[[...slug]]/route.ts  markdown version of a page (content.md)
  og/docs/[...slug]/route.tsx OG image for a page
shared/
  ui/
    sidebar-section.tsx      sidebar group heading
    page-icons.tsx           page and sidebar group icons
  components/
    app/reatom-provider.tsx  ReatomProvider from @reatom/npm-react
    theme/theme-toggle.tsx   theme button, passes the click coordinates
    wiki/wiki-page.tsx       article: read and edit in place (TipTap)
    wiki/article-html.tsx    article HTML with zoomable images (fumadocs ImageZoom)
  models/
    theme.model.ts           theme model + reveal animation
    wiki-page.model.ts       editor model (draft, save, image upload)
lib/                         server side only
  source.ts                  fumadocs source over the database (page tree, llms)
  db.ts                      PostgreSQL pool + drizzle instance, migrations on start
  schema.ts                  drizzle table definitions and inferred row types
  pages.ts                   read/write pages, sidebar tree, HTML -> markdown
  html.ts                    sanitize, plain text, heading ids + TOC
  auth.ts                    getEditor(): who may edit
  shared.ts                  URL helpers (page, markdown, OG), siteUrl
  layout.shared.tsx          nav.title (logo + PIXY + wiki), Fumadocs translations
  cn.ts                      class name helper
scripts/
  sync-wiki.mjs              pulls the wiki from the Fasberry backend into PostgreSQL
  db-import.mjs              content/seed.json (or legacy content/docs/*.mdx) -> PostgreSQL
  db-export.mjs              PostgreSQL -> content/seed.json
  lib/db.mjs, lib/content.mjs  shared database access and markup converters
content/                     local only (gitignored): seed.json, a page snapshot without images
drizzle/                     generated SQL migrations + meta journal
public/                      favicons, manifest, fonts/PIXY.ttf
proxy.ts                     .md versions and Accept: text/plain
```

## Quick start

```bash
pnpm install
pnpm db:import     # load the content/seed.json snapshot
pnpm dev           # http://localhost:3000
```

Build, standalone and preview details are in `conventions.md`.
