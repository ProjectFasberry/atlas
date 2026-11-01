# Fasberry Wiki

The project wiki at `https://wiki.fasberry.fun`: server mechanics, economy, account.
Articles live in PostgreSQL and are rendered on every request, so an edit shows up immediately.

## Stack

Next.js 16 (App Router), React 19, [Fumadocs](https://fumadocs.dev) for the layout and docs
primitives,
Drizzle ORM over PostgreSQL, [TipTap](https://tiptap.dev) for the editor, Reatom for state,
`ky` for HTTP.
Node 22 or newer.

## Running

```bash
pnpm install
export DATABASE_URL=postgres://user:pass@host:5432/general
pnpm sync:wiki   # pull articles from the backend, or pnpm db:import for a local snapshot
pnpm dev         # http://localhost:3000
```

Migrations from `drizzle/` are applied on start, so an empty database needs no setup.

## Content

| Command | What it does |
| --- | --- |
| `pnpm sync:wiki` | pulls articles from the Fasberry backend |
| `pnpm db:import` | loads the local `content/seed.json` snapshot |
| `pnpm db:export` | writes the current database into `content/seed.json` |
| `pnpm db:generate` | writes a new migration from `lib/db/schema.ts` |
| `pnpm db:migrate` | applies pending migrations by hand (the app does this on start) |

`content/` is local only and ignored by git. Images are not in the repository: articles point at
the public bucket (`volume.fasberry.fun`). Editor uploads go to `wiki_images`; a full backup is a
`pg_dump`.

## Editing

The backend decides who may edit, using the session cookie. With access granted an "Edit" button
appears and your skin head shows in the header, the "Editor" chip sits in its menu. Editing
happens in place - title, description
and body with headings, lists, quotes, links, images (up to 8 MB) and tables; every save goes into
the revision history.

```bash
WIKI_EDITOR_OPEN=1 pnpm dev   # open the editor to everyone, locally only
```

## Deploy

```bash
cd apps/wiki
make build BUILDER=im   # linux/amd64, built natively on the i-m host over ssh
```

The build context is the monorepo root, so the image uses the shared `pnpm-lock.yaml`.

The image goes to `registry.fasberry.fun/prod/wiki:latest`. On the server the service is in
`/opt/main/prod/docker-compose.prod.yml`, listens on `127.0.0.1:3007` and is published by Traefik
as `wiki.fasberry.fun`. The watchtower label rolls out a pushed `:latest` automatically.

## Languages

The UI is translated with [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs).
Messages live in `messages/ru.json` and `messages/en.json` (Russian is the base locale and the
fallback), the locale is resolved from the `locale` cookie and then `Accept-Language`, and the
proxy stores the detected language in that cookie for the next visit. Content from the database
is not translated: `pnpm translate:content` fills `wiki_page_translations` (MyMemory, free,
no key), the site serves a translation when its `source_hash` still matches the Russian page and
falls back to Russian otherwise. `--force` re-translates, `--slug <slug>` limits the run.

## Settings

Server variables are declared once in `lib/env/server.ts` and read through `getServerEnv()`
(zod validation, parsed on first use); client values live in `lib/env/public.ts`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` | the same, split, when the password needs no URI escaping |
| `WIKI_DB_POOL_MAX` | pool size, `8` by default |
| `WIKI_MIGRATIONS_DIR` | path to `drizzle/` inside the image |
| `WIKI_EDITOR_OPEN` | `1` opens the editor without permission checks, local only |
| `WIKI_AUTH_CHECK_URL` | backend address that confirms permission to edit |
| `NEXT_PUBLIC_SITE_URL` | site address for metadata and link previews |
| `PORT` | server port |

## Extras

- Every article has a markdown version: add `.md` to the address or send `Accept: text/plain`.
- `/llms.txt` and `/llms-full.txt` serve the content for language models.
- Old `/docs/*` and `/edit/*` addresses redirect to the new ones.

## Internals

Development and agent documentation: [`agent-docs`](./agent-docs/README.md).
