# Wiki: work log

Everything done to move the Fasberry wiki out of its standalone repository into this monorepo
and to bring it to production. Written after the work was finished, so it is a record, not a plan.

## 1. The app moved into the monorepo

- `apps/wiki` is the former repository `ProjectFasberry/wiki` (local folder `docs`), copied as is
  and committed as `5e91b57 add wiki app` on `staging`.
- The old repository and its `.git` were deleted, the remote `ProjectFasberry/wiki` is retired.
- Package name `wiki`, scripts follow the monorepo: `build`, `dev`, `start`, `lint`, `type-check`
  (`pnpm --filter *` runs them), plus `db:*` and `translate:content`.
- `pnpm-lock.yaml` merged into the root lockfile; `pnpm-workspace.yaml` got the fumadocs
  `minimumReleaseAgeExclude` entries and a `@tiptap/pm` override (pin 3.10.5, otherwise pnpm keeps
  two copies of `@tiptap/core` and command types stop resolving).
- `apps/wiki` is excluded from the root biome config and has its own `biome.json` (spaces, single
  quotes, five deliberate CSS/HTML rules off).
- `next.config.mjs`: `outputFileTracingRoot` points at the monorepo root; the Docker context is the
  repository root, like `apps/minotaur`.
- `AGENTS.md` inside the app: ask before commit and push; **no React hooks for business or UI
  logic**, everything in Reatom models; locale is an atom, not a context.

## 2. Data: SQLite to PostgreSQL with Drizzle

- `node:sqlite` removed completely; the app, the CLI scripts and the seed flow work through
  Drizzle ORM over PostgreSQL (`pg`).
- Schema in `lib/schema.ts`, migrations in `drizzle/` (applied by `lib/db.ts` on start, journal
  table `public.wiki_migrations`), `drizzle.config.ts` for `generate` / `migrate`.
- Tables: `wiki_pages`, `wiki_revisions`, `wiki_images` (bytea), `wiki_page_translations`,
  `wiki_section_translations`.
- `savePage` writes the page and its revision in one transaction.
- Legacy SQLite paths removed: `scripts/db-pg.mjs`, `db/postgres/schema.sql`, `data/`, env
  `WIKI_DB_PATH`.

## 3. Images left the repository

- `public/images` (18 MB) deleted; 72 references in the content now point at
  `https://volume.fasberry.fun/static/game-content/...` (mapping rebuilt from the backend API by
  file basename, 36 unique URLs checked with HEAD).
- `sync:wiki` no longer downloads images: it keeps the public bucket URL, the placeholder and the
  download code were removed.

## 4. Deployment

- `Dockerfile`: Node 26 alpine, pnpm 12, multi-stage, standalone output, npm/corepack removed from
  the runtime stage, non-root user, healthcheck; the image ships `drizzle/` and `public/`.
- `Makefile`: `make build BUILDER=im` builds `linux/amd64` natively on `i-m` through the ssh buildx
  builder and pushes `registry.fasberry.fun/prod/wiki:latest`; `make warm` primes the OG card cache.
- `i-m`, `/opt/main/prod/docker-compose.prod.yml`: service `wiki`, container `prod-app-wiki`,
  `127.0.0.1:3007` from `WIKI_EXTERNAL_PORT`, `PGHOST=prod-db-general` with the existing
  `GENERAL_POSTGRES_*` variables, watchtower label.
- Traefik (file provider): router `wiki` and `wiki-svc` on `http://127.0.0.1:3007`.
- The container applies migrations on start, so a deploy never needs a manual step.

## 5. Infrastructure fixes made on the way

- **zot** stored blobs through `http://rustfs:9000`, but `rustfs` resolves to the dev instance while
  the credentials belong to prod: pushes failed with `InvalidAccessKeyId`. Endpoint changed to
  `http://infra-prod-rustfs:9000`.
- **Traefik** could not get a certificate through the Cloudflare DNS challenge: `api.cloudflare.com`
  is unreachable from `i-m`. Added the `httpresolver` (HTTP-01, own `acme-http.json`), the wiki
  router uses it.
- **thunderbird image build** on `i-m` fails twice: the `infisical` deb is served from a CDN that is
  blocked there, and `bun install` needs `NODE_AUTH_TOKEN` for `@projectfasberry/events`. The build
  uses an `.npmrc` copy, the token from `aether/.env` as a build arg, and the `infisical` binary
  taken from the running image (temporary Dockerfile, not committed).
- **watchtower** did not pick the new image up on its own; `compose pull && up -d` was used.

## 6. Backend changes (aether, `thunderbird`)

- `GET /launcher` returns the launcher builds (`{ artifacts: [{ platform, url }] }`) and
  `GET /launcher/:platform` redirects to the file. Links live in the `ip_list` registry
  (`launcher-windows`), so a new build does not need a frontend deploy.
- `GET /wiki/access` answers whether the current session may edit: `session` cookie, nickname from
  Redis, `canEdit` true only for `distribate` (`WIKI_EDITORS` set, to be replaced by a permission).
- `GET /server-ip` removed together with the sidebar panel that used it.

## 7. taurus (landing)

- `/wiki` and `/wiki/*` redirect permanently to `https://wiki.fasberry.fun` (declarative
  `redirects` in `+config.ts`, glob supported by vike), the whole `pages/wiki` section and its
  navigation entry were removed.
- Header keeps the wiki link, now pointing at the new site; the two gameplay cards whose pages do
  not exist on the new wiki link to its root.
- `deploy:all` fixed: `pnpm deploy` is a reserved pnpm command, it is `wrangler deploy` now.

## 8. Wiki app features

- **SEO**: metadata in `lib/seo/*` (site constants, root and per-page builders, JSON-LD
  `WebSite` + `SearchAction` + `Organization` with Telegram, `Article` for pages), `sitemap.xml`
  and `robots.txt` generated from the database.
- **OG card**: dynamic per page, `next/og`, hero art from the volume downscaled once into
  `public/og-bg.jpg`, section chip, title, description, domain; results cached in memory, `make warm`
  fills the cache; emoji are stripped because satori otherwise fetches glyphs from a blocked CDN.
- **Fumadocs**: `dynamicLoader` source over the database (`lib/source.ts`) builds the page tree,
  breadcrumbs and llms endpoints; `proxy.ts` uses the library negotiation (`isMarkdownPreferred`,
  `rewritePath`); images in articles render through `ImageZoom`; search stays custom.
- **i18n**: Paraglide (`project.inlang`, `messages/{ru,en}.json`, base locale ru), locale from the
  `locale` cookie and then `Accept-Language`, cached in the cookie by the proxy. `$locale` atom plus
  `LocaleSync`; no React context. Language switch sits next to the theme switch in the header.
- **Theme**: the class and `color-scheme` are rendered by the server from the `theme` cookie, so
  there is no flash and no script before paint. The switch animates with View Transitions
  (Chromium) or a cover layer (Firefox, Safari) and stores the cookie.
- **Content translation**: `pnpm translate:content` (`scripts/translate-content.mjs`) translates
  pages and section names into `wiki_page_translations` / `wiki_section_translations` with
  MyMemory (free, no key); `source_hash` marks a translation as stale. The site serves a fresh
  translation, otherwise the Russian original. Categories in the sidebar are translated too.

## 9. Known gaps

- MyMemory quality is mediocre and it has a daily quota; the `engine` column allows replacing it
  (DeepL needs a card, LibreTranslate hangs on start on both hosts, Google and Lingva are
  unreachable from `i-m`).
- Translations are machine-only: there is no UI to edit them. The canonical text is Russian.
- The editor is enabled only for `distribate`; a permission/role check is the next step.
- `WIKI_AUTH_CHECK_URL` points at the backend, which the wiki calls with the forwarded `cookie`
  header; the cookie name is never hardcoded in the app.
- Article code blocks are not highlighted: there are none in the content, and the sanitizer strips
  `class`, so the language is lost on save.
- The image is `linux/amd64` only; builds rely on the ssh buildx builder `im`.
