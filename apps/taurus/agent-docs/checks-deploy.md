# Checks, build and deploy

Run from `apps/taurus` or with the package filter.

## Commands

```bash
pnpm --filter taurus dev          # Infisical /taurus; Vike on :3005
pnpm --filter taurus type-check   # tsc --build
pnpm --filter taurus test:e2e     # Playwright + mock API on :3101
pnpm --filter taurus test:e2e:install
pnpm --filter taurus build:prod   # Infisical /taurus; Cloudflare Worker build
pnpm --filter taurus size         # local size report
pnpm --filter taurus deploy:all   # type-check + build + size:prod + deploy
```

- `dev` and `build:prod` require an Infisical session. Without it, use
  `e2e/serve.mjs` for a mocked SSR check.
- `lint` is not a gate: the root Biome config excludes `apps/taurus`. Do not
  claim a lint pass; rely on `type-check`, e2e and review.
- `size:prod` runs under Infisical `/glaux`; `deploy:all` tolerates its failure.

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
- `dist/`, `.wrangler/`
- `public/sprites/`, `shared/sprite.gen.ts`
- `shared/types/gen.ts` and `pkgs/shared/types/gen/`
- `node_modules/`; dependencies via `pnpm`, never hand-edited lockfiles

## Deploy

Taurus deploys manually to Cloudflare; there is no taurus GitHub workflow.

```bash
pnpm --filter taurus build:prod
pnpm exec wrangler deploy
```

- Worker name: `landing`; custom domain: `fasberry.fun`.
- `wrangler` reads `.wrangler/deploy/config.json`, which points at
  `dist/server/wrangler.json`; build first.
- Auth: `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) and
  `CLOUDFLARE_ACCOUNT_ID` in the environment. A local `.env` may hold the token
  under `CLOUDFLARE_API_KEY`; map it for the command, never print or commit it.
- `wrangler whoami` before deploy. Run `--dry-run` if unsure.
- `deploy:all` is the canonical chain; `pnpm exec wrangler deploy` alone is valid after a
  successful build.
- Deploy only on an explicit request, from a tree whose changes are understood.
  Other apps may be dirty; do not include them.
- After deploy verify `/`, `/rules`, `/support`, `/gallery`, `/modpack`:
  HTTP 200, expected copy, no console errors, no horizontal overflow.
- Rollback is a redeploy of the previous worker version; report the version ID.

## Git

- Never commit/push/deploy without an explicit request.
- Stage only `apps/taurus` for a taurus task.
- Pre-commit runs a repo-wide type-check; on `w-m` ensure `bun` is on PATH
  (`PATH="$HOME/.bun/bin:$PATH"`). Do not use `--no-verify` to hide a failure.
- Short lowercase commit messages, e.g. `taurus: simplify landing copy`.
- No `dist/`, `.wrangler/`, `paraglide/` or secrets in a commit.
