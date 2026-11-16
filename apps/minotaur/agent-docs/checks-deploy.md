# Checks, generated files and deploy

## Commands

Run from the repo root or with the package filter:

```bash
pnpm --filter minotaur dev            # local dev (apps/minotaur/.env)
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

- Build/dev read public `VITE_*` values from `apps/minotaur/.env`; CI resolves
  them from repository variables with prod defaults.
- Never print or commit secrets; runtime values live in the host env files.

## Deploy

- The app is built by `.github/workflows/build-minotaur.yml` into
  `registry.fasberry.fun/<stage>/minotaur:latest` and `:sha-<commit>`.
- Branch rule: `main` -> prod, `staging` -> staging, `dev` -> dev.
- Rollout is manual: after CI pushes, run
  `ssh i-m '/opt/main/fasberry deploy prod minotaur'`. The
  `fasberry-pull-update.timer` is not installed; do not edit the host or compose
  files from a workstation.
- Deploy only on an explicit request, from a clean tree, and report the image
  digest plus a health check.
- Local `bun --bun run vike build` needs the production `VITE_*` env
  (`VITE_API_URL`, `VITE_APP_URL`, `VITE_PANEL_API_URL`, `VITE_APP_PORT`, ...) in
  `apps/minotaur/.env`;
  a missing `VITE_APP_PORT` makes the server start with `NaN`.

## Git hygiene

- Never commit/push without an explicit request.
- Stage only the files in scope; another task may have uncommitted changes.
- Do not commit `dist/`, generated output or secrets.
- Commit messages are short, lowercase, conventional.
