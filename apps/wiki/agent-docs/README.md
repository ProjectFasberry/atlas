# Project map for agents

Fasberry wiki: Next.js 16 (App Router) + Fumadocs UI, content in PostgreSQL, editor built on TipTap,
state on Reatom v3. It lives at `https://wiki.fasberry.fun`; the wiki sits at the domain root and
is split by server: `/` and `/<slug>` are the default server (`bisquite`), `/<server>/<slug>` is
another one, for example `/muffin/armor`.

This directory is the entry point. Read in order:

| File | About |
| --- | --- |
| `architecture.md` | Routes, rendering, data flow, `proxy.ts`, llms/og |
| `data.md` | Drizzle schema and migrations, the `sync:wiki` flow, environment variables |
| `editor.md` | Inline editor: component, Reatom model, save and upload APIs |
| `i18n.md` | Paraglide messages, locale resolution, content translation |
| `ui.md` | Theme and circle animation, 80px header, favicons, palette |
| `conventions.md` | Code style, Reatom v3 rules, pitfalls, deploy and preview |

## Things worth knowing before the first change

- Content is not MDX: articles live in PostgreSQL and are rendered on every request, so an edit
  shows up immediately and `dynamic = 'force-dynamic'` is deliberate.
- Pages, translations and revisions are keyed by `(server, slug)`; the switcher list comes from
  the public `/servers-with-map` api and is cached for five minutes.
- `lib/` is server code grouped by domain (content, db, env, i18n, seo, ui config, utils);
  `shared/` is what reaches the browser - Reatom models plus components. A file that imports
  `lib/` from a client component is a mistake.
- Russian is the source locale, English is machine translated and stored next to the page; a
  translation is used only while its `source_hash` matches the Russian page.
- The theme class is rendered on `<html>` by the server from the `theme` cookie - there is no
  script before paint, and the switch only writes the cookie.
- The locale comes from the `locale` cookie, then `Accept-Language`; `proxy.ts` caches it and also
  serves `.md` / `Accept: text/plain` versions of a page.
- Search is a custom route that returns the Fumadocs result shape; it indexes the current locale.
- Reusable UI primitives (player head, chips) live in `pkgs/ui` as `@repo/ui`; the wiki gets their
  classes through an explicit `@source` in `app/global.css`. The Solid app (taurus) does not use them.
- UI state and logic live in Reatom models, never in React hooks (see `conventions.md`).

## Quick start

```bash
pnpm install
pnpm db:import     # load the content/seed.json snapshot
pnpm dev           # http://localhost:3000
```

Build, standalone and preview details are in `conventions.md`.
