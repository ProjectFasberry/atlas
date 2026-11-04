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

Production code: `/home/rusik/work/fasberry/atlas/apps/wiki` (monorepo `atlas`). The app runs
in standalone mode and stores content in PostgreSQL on the deploy host (`prod-db-general`,
database `general`).

```bash
pnpm --filter wiki type-check
```

Deploys are pull-based: push to `dev`/`staging` for the staging image or `main` for prod.
`.github/workflows/build-wiki.yml` builds `linux/amd64` on `ubuntu-latest` and pushes
`registry.fasberry.fun/<stage>/wiki:latest` plus `:sha-<commit>`. The host runs a pull timer
installed from the infra repo every two minutes and recreates `prod-app-wiki` only when the
digest changed. There is no ssh/buildx path from a workstation.

The staging stack currently has no `wiki` service, so the staging image is built for parity but
is not rolled out until the infra repo adds it.

The workflow needs `REGISTRY_USERNAME` and `REGISTRY_PASSWORD`; `NODE_AUTH_TOKEN` is optional and
is mounted as a BuildKit secret for private packages. `NEXT_PUBLIC_SITE_URL_{PROD,STAGING}`
is a repo variable (default `https://wiki.fasberry.fun`) and is baked into the image at build
time; database and auth settings are read at runtime.

The app lives in the pnpm workspace, so the build context is the repository root and
`next.config.mjs` sets `outputFileTracingRoot` to it. Dependencies come from the root
`pnpm-lock.yaml`. Biome is switched off for this app for now: the root config excludes
`apps/wiki` and there is no local config, so `pnpm lint` here checks nothing.

Host-side facts (owned by the infra repo): service `wiki` in
`/opt/main/prod/docker-compose.prod.yml`, container `prod-app-wiki`, `127.0.0.1:3007` published
by Traefik as `wiki.fasberry.fun`. A rollback pins `:sha-<commit>` in that compose file rather
than rebuilding. Do not run compose or any host command from this checkout.

Notes:
- the schema is applied by the app on the first query, so a new database needs no migration step;
- certificates for `wiki.fasberry.fun` come from the `httpresolver` (HTTP-01). The main
  `myresolver` uses the Cloudflare DNS challenge, and `api.cloudflare.com` is unreachable from
  the host, so DNS-01 hangs there;
- do not push without an explicit request (`AGENTS.md`).

## Checks

- `pnpm --filter wiki type-check` - `next typegen` + `tsc --noEmit`.
- `pnpm --filter wiki test:e2e` - Playwright against a production build; see `e2e/README.md`.
  It needs a throwaway PostgreSQL (`E2E_DATABASE_URL`, the script refuses a URL without `e2e`
  in it) and runs its own mock backend, so the real API and session cookies are never touched.
- Quick check after a rollout: `curl -s -o /dev/null -w '%{http_code}' https://wiki.fasberry.fun/`
- Test the theme animation in Chromium and Firefox separately: the paths differ.
