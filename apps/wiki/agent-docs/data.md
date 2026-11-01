# Data: PostgreSQL and scripts

## Database

PostgreSQL. Connection from `DATABASE_URL`, or from the standard `PG*` variables
(`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) when the password cannot be put into
a URI without escaping. `lib/db/index.ts` keeps one pool per process (`WIKI_DB_POOL_MAX`, 8 by default).

Schema: `lib/db/schema.ts` (drizzle `pgTable` definitions). Migrations are generated into `drizzle/`
and applied by the application on start (`drizzle-orm` migrator, journal table
`public.wiki_migrations`), so a fresh database and a fresh container need no manual step. The
image ships `drizzle/`; `WIKI_MIGRATIONS_DIR` overrides its location.

Queries go through drizzle (`lib/db/index.ts` exposes `database()`, `getDb()` and the schema), so a row
type comes from `typeof wikiPages.$inferSelect` rather than a hand-written interface.

### `wiki_pages`

| Field | Meaning |
| --- | --- |
| `slug` (PK) | page key, `''` is the overview; a `/`-separated path |
| `title`, `description` | heading and a short description |
| `html` | sanitized HTML (source of truth for rendering) |
| `markdown` | derived from `html` (turndown), served by the `.md` versions |
| `section` | sidebar group, `null` means no group |
| `position` | order within the list |
| `source` | `seed` / `sync` / `editor` / `mdx` |
| `updated_at`, `updated_by` | time (`timestamptz`) and author of the last edit |

### `wiki_revisions`

Edit history written by the editor: `id` (identity), `slug` (FK to `wiki_pages`, `ON DELETE
CASCADE`), `title`, `description`, `html`, `created_at`, `author`. Written in the same transaction
as the page update (`savePage` in `lib/content/pages.ts`). There is no rollback UI yet - the data is there.

### `wiki_images`

`id` (`<uuid>.<ext>`), `mime`, `data` (`bytea`), `created_at`. Upload - `POST /api/wiki/upload`,
serving - `GET /api/images/<id>` with a one-year immutable cache.

The prefix keeps the wiki tables apart from the backend's own `wiki` and `wiki_groups` tables in
the shared `general` database.

## Scripts

```bash
pnpm sync:wiki                    # Fasberry backend -> PostgreSQL
pnpm db:import                    # content/seed.json -> PostgreSQL
pnpm db:import --force            # also overwrite pages edited in the editor
pnpm db:export                    # PostgreSQL -> content/seed.json
```

- `sync-wiki.mjs` calls `WIKI_API_URL` (default `https://api.fasberry.fun`) for
  `/wiki/categories` and `/wiki/category/{slug}`, converts TipTap JSON into HTML/markdown and
  writes pages into PostgreSQL. Images stay in the public bucket: the script only normalises
  legacy addresses (`volume.fasberry.su`, local MinIO) to `volume.fasberry.fun` and reports the
  skipped nodes in `content/wiki-sync-report.json` (not tracked by git).
- `db-import.mjs` reads the local `content/seed.json` (ignored by git); if `content/docs/*.mdx` exists next to it (the old
  migration), it uses those. Without `--force` it does not overwrite pages with `source = 'editor'`.
- `db-export.mjs` writes a snapshot of `wiki_pages` into `content/seed.json` (local, not in git). Images from
  `wiki_images` do not go into the snapshot - a full backup is a `pg_dump`.
- `drizzle-kit generate` (`pnpm db:generate`) writes a new migration from `lib/db/schema.ts`;
  `drizzle-kit migrate` (`pnpm db:migrate`) applies the pending ones by hand, which the app does
  on start anyway.

## Environment variables

Every server variable is declared once in `lib/env/server.ts` (zod 4) and read through
`getServerEnv()`: the schema is parsed on first use, so a build without secrets passes and a broken
deploy fails with a readable message. Client values live in `lib/env/public.ts` (`publicEnv.siteUrl`),
because `process.env.NEXT_PUBLIC_*` has to be read literally to be inlined.

| Variable | Where | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | server, scripts | PostgreSQL connection string |
| `PGHOST` … `PGDATABASE` | server, scripts | the same in separate variables, no URI escaping |
| `WIKI_DB_POOL_MAX` | server | pool size, `8` by default |
| `WIKI_EDITOR_OPEN` | server | `1` opens the editor to everyone (locally, preview) |
| `WIKI_AUTH_CHECK_URL` | server | endpoint that answers from the cookie whether editing is allowed |
| `NEXT_PUBLIC_SITE_URL` | build | base URL for metadata, defaults to `https://wiki.fasberry.fun` |
| `WIKI_API_URL` | `sync:wiki` | content source |
| `PORT` | standalone | server port |

Access logic lives in `lib/auth.ts`, `getEditor()`:
`WIKI_EDITOR_OPEN=1` -> the `{id:'local'}` stub; otherwise both `WIKI_AUTH_CHECK_URL` and the incoming
`cookie` header are required, the request is a `ky` GET with a 5 s timeout and `canEdit` is read from the
response (including nested `data`/`user`). The httpOnly cookie of the `.fasberry.fun` domain is
sent to the wiki too and never leaves the server.

Without permission, `PUT`/`POST` answer 403 and the "Edit" button is not rendered.
