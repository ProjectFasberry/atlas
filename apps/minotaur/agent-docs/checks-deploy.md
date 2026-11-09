# Checks, generated files and deploy

## Commands

Run from the repo root or with the package filter:

```bash
pnpm --filter minotaur dev            # local dev (Infisical env)
pnpm --filter minotaur type-check     # sprite patch + tsc --build
pnpm --filter minotaur lint           # biome
pnpm --filter minotaur circular-check # dpdm on the server entry
pnpm openapi:prod                     # regenerate API types from the prod spec
pnpm openapi:dev                      # against local 4104/4105
bun run gen:icons                     # regenerate the SVG sprite
```

- `type-check` runs `scripts/fix-sprite.ts` first; it patches the generated
  sprite with `// @ts-nocheck`. Do not remove that patch.
- `openapi:prod`/`openapi:dev` write into `pkgs/shared/types/gen/{main,panel}`;
  minotaur re-exports them from `shared/types/gen/api/*.schema.ts`.
- `lint` uses the repo Biome config; match the file's existing quotes/tabs.
- Run type-check and lint for every change; circular-check when models or the
  server entry change.

## Generated / do not edit

- `paraglide/`
- `shared/types/gen/icon/sprite.gen.ts`
- `shared/types/gen/api/*.schema.ts` and the source under
  `pkgs/shared/types/gen/`
- `dist/`, `node_modules/`, build caches
- `pnpm-lock.yaml` is tracked: change dependencies with pnpm, never by hand.

## Local setup

- `infisical login`; build/dev scripts run `infisical run --path=/minotaur`.
- `.env.local` holds `INFISICAL_CLIENT_ID`, `INFISICAL_CLIENT_SECRET`,
  `INFISICAL_PROJECT_ID`, `INFISICAL_API_URL` for local runs.
- Never print or commit secrets; runtime values come from Infisical.

## Deploy

- The app is built by `.github/workflows/build-minotaur.yml` into
  `registry.fasberry.fun/<stage>/minotaur:latest` and `:sha-<commit>`.
- The documented branch rule is `main` -> prod, `dev`/`staging` -> staging; the
  current workflow resolves `prod` for every push event, so verify the workflow
  before deploying from a non-main branch.
- The host pulls images on a timer; do not ssh/scp/docker into `i-m` or run
  compose there. Host, registry and compose changes belong to the infra repo.
- Deploy only on an explicit request, from a clean tree, and report the image
  digest plus a health check.
- Local `bun --bun run vike build` needs the production `VITE_*` env
  (`VITE_API_URL`, `VITE_APP_URL`, `VITE_PANEL_API_URL`, `VITE_APP_PORT`, ...);
  a missing `VITE_APP_PORT` makes the server start with `NaN`.

## Git hygiene

- Never commit/push without an explicit request.
- Stage only the files in scope; another task may have uncommitted changes.
- Do not commit `dist/`, generated output or secrets.
- Commit messages are short, lowercase, conventional.
