# Conventions and pitfalls

## Code

- TypeScript, function components, named exports.
- Imports use the `@/` alias (see `tsconfig.json`).
- Styling is Tailwind v4 + Fumadocs tokens (`bg-fd-card`, `text-fd-muted-foreground`,
  `border-fd-border`, `ring-fd-ring`); classes are joined with `cn` from `lib/utils/cn.ts`.
- Comments explain "why", not "what", and follow the style of the surrounding code.
- Keep changes minimal, do not refactor neighbouring code.

## Reatom v3

Hard rule: **no React hooks for business or UI logic**. No `useState`, `useEffect`, `useMemo`,
`useCallback`, `useReducer` or `useContext` for state. All state and logic lives in models built
from `@reatom/*`; components only render. `useRef` is fine for DOM access only, and `useAtom` /
`useCtx` are for library components that require a hook. Local UI state (open/closed, hover,
selected tab, drafts) goes to atoms as well. The locale follows the same rule: `$locale` atom in
`shared/models/locale.model.ts`, hydrated by `locale-sync.tsx` from the server value.

- Atoms are prefixed with `$`, without the `Atom` suffix; the name is the second argument:
  `atom(x, 'theme')`.
- Actions are attached with `withAssign((_, name) => ({ ... }))`, named `${name}.action`.
- Scope atoms derive from nullable state: `atom((ctx) => (ctx.spy($x) ?? default) === ...)`.
- Async work is `reatomAsync` with `onFulfill` / `onReject`, no `try/catch` in components.
- Subscriptions and derived values live inside `reatomComponent` via `ctx.spy`; `reatomComponent`
  is the default way to connect a component to a model.
- `onConnect($atom, ...)` handles lazy initialisation on the first subscription (that is how the
  theme is read).
- The provider is `shared/components/app/reatom-provider.tsx`.

## Next.js

- `app/layout.tsx` and pages that touch the database use `dynamic = 'force-dynamic'`, no caching.
- Page metadata comes from `generateMetadata` in `app/[[...slug]]/page.tsx`.
- Route params are a `Promise` in Next 16, they have to be awaited (`PageProps<'/[[...slug]]'>`).
- Saving an article calls `revalidatePath`, but the UI reloads the page anyway.

## Database

- Drizzle ORM, never raw SQL in application code: `const db = await database()` from `lib/db/index.ts`,
  tables from `lib/db/schema.ts`. Types come from `typeof wikiPages.$inferSelect`.
- The pool and the drizzle instance are cached on `globalThis`, one per process.
- Writes that touch more than one row go through `db.transaction` (see `savePage`).
- `lib/db/schema.ts` is the source of truth. After changing it run `pnpm db:generate`, commit the new
  file in `drizzle/`; migrations are applied by the app on start (`public.wiki_migrations`).
- `content/` is local only (`/content/` in `.gitignore`): `seed.json` is an export without
  images; a full backup is `pg_dump`.

## Theme: what not to do

- Animating `mask-size` / `mask-position` on `::view-transition-*` - the mask flickers.
- Relying on `clip-path` or `mask-image` on `::view-transition-*` in Gecko - it does not render,
  Firefox must go through the cover path.
- Appending layers after `commitTheme` in the fallback path - that produces a flash of the old or
  new background.
- Forgetting to remove `--theme-reveal-*` from `:root` after a VT - the next click will start the
  circle from the wrong place.

## Build and deploy

Production code: `/home/rusik/work/fasberry/atlas/apps/wiki` (monorepo `atlas`). Node in
`~/.local/node-v25.9.0/bin`, pnpm in `~/.local/share/pnpm/bin`. The app runs in standalone mode
and stores content in PostgreSQL on `i-m` (`prod-db-general`, database `general`).

```bash
pnpm --filter wiki type-check
make -C apps/wiki build BUILDER=im   # linux/amd64, pushes registry.fasberry.fun/prod/wiki:latest
```

The app lives in the pnpm workspace, so the build context is the repository root and
`next.config.mjs` sets `outputFileTracingRoot` to it. Dependencies come from the root
`pnpm-lock.yaml`. Biome is switched off for this app for now: the root config excludes
`apps/wiki` and there is no local config, so `pnpm lint` here checks nothing.

`BUILDER=im` is a docker buildx builder over ssh to the `i-m` host (`ssh://i-m`,
`docker-container` driver), so the image is built natively on x86 instead of QEMU on the arm64
Mac. Without it the same command builds locally and is several times slower.

On the server (`i-m`):
- service `wiki` in `/opt/main/prod/docker-compose.prod.yml`, container `prod-app-wiki`;
- `ports: ${WIKI_EXTERNAL_PORT}:3000` with `WIKI_EXTERNAL_PORT=127.0.0.1:3007` in
  `/opt/main/prod/.env` (the ansible `safe_ports` role clamps it to loopback);
- database settings come from `PGHOST=prod-db-general` plus the existing `GENERAL_POSTGRES_*`
  variables, so no password is duplicated in the compose file;
- Traefik picks it up from `/opt/main/infra/config/traefik/config/dynamic.yml`
  (router `wiki` -> service `wiki-svc` -> `http://127.0.0.1:3007`);
- the `com.centurylinklabs.watchtower.enable` label means a pushed `:latest` is rolled out
  automatically, no manual `compose up`.

```bash
cd /opt/main/prod
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up -d wiki
docker logs -f prod-app-wiki
```

Notes:
- the schema is applied by the app on the first query, so a new database needs no migration step;
- certificates for `wiki.fasberry.fun` come from the `httpresolver` (HTTP-01). The main
  `myresolver` uses the Cloudflare DNS challenge, and `api.cloudflare.com` is unreachable from
  `i-m`, so DNS-01 hangs there;
- do not push without an explicit request (`AGENTS.md`).

## Checks

- `pnpm --filter wiki type-check` - `next typegen` + `tsc --noEmit`.
- Quick check after deploy: `curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3007/`
- Test the theme animation in Chromium and Firefox separately: the paths differ.
