# Fasberry Wiki

The project wiki at `https://wiki.fasberry.fun`: server mechanics, economy, account.
Articles live in PostgreSQL and are rendered on every request, so an edit shows up immediately.

## Stack

Next.js 16 (App Router), React 19, [Fumadocs](https://fumadocs.dev) for layout and search,
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
| `pnpm db:generate` | writes a new migration from `lib/schema.ts` |
| `pnpm db:migrate` | applies pending migrations by hand (the app does this on start) |

`content/` is local only and ignored by git. Images are not in the repository: articles point at
the public bucket (`volume.fasberry.fun`). Editor uploads go to `wiki_images`; a full backup is a
`pg_dump`.

## Editing

The backend decides who may edit, using the session cookie. With access granted an "Edit" button
appears and the "Editor" badge shows in the corner. Editing happens in place - title, description
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

## Settings

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PGHOST`/`PGPORT`/`PGUSER`/`PGPASSWORD`/`PGDATABASE` | the same, split, when the password needs no URI escaping |
| `WIKI_DB_POOL_MAX` | pool size, `8` by default |
| `WIKI_MIGRATIONS_DIR` | path to `drizzle/` inside the image |
| `WIKI_EDITOR_OPEN` | `1` opens the editor without permission checks, local only |
| `WIKI_AUTH_CHECK_URL` | backend address that confirms permission to edit |
| `WIKI_AUTH_COOKIE` | session cookie name, `fasberry_session` by default |
| `NEXT_PUBLIC_SITE_URL` | site address for metadata and link previews |
| `PORT` | server port |

## Extras

- Every article has a markdown version: add `.md` to the address or send `Accept: text/plain`.
- `/llms.txt` and `/llms-full.txt` serve the content for language models.
- Old `/docs/*` and `/edit/*` addresses redirect to the new ones.

## Internals

Development and agent documentation: [`agent-docs`](./agent-docs/README.md).
