# Checks, build and deploy

Run from `apps/taurus` or with the package filter.

## Commands

```bash
pnpm --filter taurus dev          # apps/taurus/.env; Vike on :3005
pnpm --filter taurus type-check   # tsc --build
pnpm --filter taurus test:e2e     # Playwright + mock API on :3101
pnpm --filter taurus test:e2e:install
pnpm --filter taurus build:prod   # prod build (self-hosted Node server)
pnpm --filter taurus size         # local size report
pnpm --filter taurus size:prod    # build + upload the size report
```

- `dev` and `build:prod` read public `VITE_*` values from `apps/taurus/.env`;
  CI resolves them from repository variables. Without them, use `e2e/serve.mjs`
  for a mocked SSR check.
- `lint` is not a gate: the root Biome config excludes `apps/taurus`. Do not
  claim a lint pass; rely on `type-check`, e2e and review.
- `size:prod` uses the prod `STAGE`; CI uploads the same report on `main`.

## E2E

`e2e/serve.mjs` starts a mock API (`e2e/mock-backend.mjs`, :4546) and `vike dev`
(:3101). Tests are SSR request assertions; browser interactions are manual.

- When adding an API call, add the route to `e2e/mock-backend.mjs` with the
  real response shape.
- Add assertions for new sections and removed links.
- `test:e2e` must pass before any build/deploy.
- Do not point tests at production.

## Generated / do not edit

- `paraglide/`
- `dist/`
- `public/sprites/`, `shared/sprite.gen.ts`
- `shared/types/gen.ts` and `pkgs/shared/types/gen/`
- `node_modules/`; dependencies via `pnpm`, never hand-edited lockfiles

## Deploy

Taurus ships as a container image, like the other container apps.

- Push to `main` runs `.github/workflows/build-taurus.yml`: it builds the client
  bundle on the runner (`vike build`, node rather than bun)
  and pushes `registry.fasberry.fun/<stage>/taurus:latest` plus
  `:sha-<commit>` (`linux/amd64`, `apps/taurus/Dockerfile`).
- The image carries only `dist/`; `entrypoint.sh` runs
  `bun run ./dist/server/index.mjs`.
- Rollout is manual on the host and belongs to the infra repo:
  `ssh i-m '/opt/main/fasberry deploy prod taurus'`.
- Rollback pins `prod/taurus:sha-<commit>` in the host compose file, not a rebuild.
- Deploy only on an explicit request, from a tree whose changes are understood.
  Other apps may be dirty; do not include them.
- After rollout verify `/`, `/rules`, `/support`, `/gallery`, `/modpack`, `/credits`:
  HTTP 200, expected copy, no console errors, no horizontal overflow. Report the
  image digest, not just "deployed".
- The container is the only target: `vite build` emits the Node server entry,
  and `wrangler.jsonc`/`@cloudflare/vite-plugin` are gone from the app.

## Git

- Never commit/push/deploy without an explicit request.
- Stage only `apps/taurus` for a taurus task.
- Pre-commit runs a repo-wide type-check; on `w-m` ensure `bun` is on PATH
  (`PATH="$HOME/.bun/bin:$PATH"`). Do not use `--no-verify` to hide a failure.
- Short lowercase commit messages, e.g. `taurus: simplify landing copy`.
- No `dist/`, `paraglide/` or secrets in a commit.
