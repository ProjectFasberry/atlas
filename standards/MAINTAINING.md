## Development Scripts & Tasks

The `package.json` defines several commands for routine maintenance:

- **Linting & Formatting:**
  `pnpm lint` (Runs `bunx biome lint`)
  Ensure Biome passes before committing. Biome acts as both our formatter and linter.

- **Type Checking:**
  `pnpm type-check`
  Runs SVG sprite generation (`scripts/fix-sprite.ts`) and TypeScript compilation (`tsc --build`).

- **Circular Dependencies:**
  `pnpm circular-check`
  Runs `dpdm` against the renderer to prevent circular dependency warnings.

- **Generating Translations:**
  `pnpm gen:translate`
  Triggers Inlang machine translation to update the Paraglide SDK. Run this whenever you add or modify strings in the `messages/` folder.

- **Generating Icons:**
  `pnpm gen:icons`
  Executes `scripts/generate-icons.ts` to build out standard UI icons.

## OpenAPI types

The generated clients live in `pkgs/shared/types/gen/` (`main` and `panel`). Regenerate
them after any backend route or schema change:

- `pnpm openapi:prod` - from `api.fasberry.fun` and `panel.fasberry.fun`.
- `pnpm openapi:dev` - from the local backend at `127.0.0.1:4104` and `:4105`.
- `pnpm openapi:check` - CI guard; fails when the checked-in types are stale.

The same scripts work from `pkgs/shared`. Prod URLs come from
`pkgs/shared/.env.local` (`API_MAIN_OPENAPI_URL`, `API_PANEL_OPENAPI_URL`, optionally
`API_PANEL_AUTHORIZATION_KEY`); the generator renders them into Redocly because this
version does not expand `${VAR}` itself. Never commit `.env.local`.

## Build size tracking

`scripts/build-size.mjs` measures gzipped build output per release for
`minotaur`, `wiki` and `taurus` (client JS/CSS/fonts/images, other client files
and the server bundle; Docker image size is not tracked). It writes the payload
consumed by `POST /metrics/build` on glaux, which stores rows in the
`build_metrics` database on the general Postgres server.

- `minotaur` and `wiki` upload after the production build on `main`
  (`build-*.yml`) when `BUILD_METRICS_TOKEN` is set.
- `taurus` deploys manually with `wrangler`: `pnpm --filter taurus size` prints
  a local report, `pnpm --filter taurus size:prod` uploads it through
  `infisical run --env=prod --path=/glaux`, and `deploy:all` calls `size:prod`.
- Repo secret `BUILD_METRICS_TOKEN` must match `BUILD_METRICS_TOKEN` in
  Infisical `/glaux`; glaux also needs `BUILD_METRICS_POSTGRES_URI` pointing at
  the `build_metrics` database.
- The table is created by glaux on boot; the database itself is provisioned on
  the host.

## Build and deploy

Container apps (`minotaur`, `wiki`) are built by GitHub Actions only:

- `.github/workflows/build-<app>.yml` runs on `ubuntu-latest` for push to `main`
  (prod) and `dev`/`staging` (staging), plus manual dispatch with a stage input.
- It pushes `registry.fasberry.fun/<stage>/<app>:latest` and
  `:sha-<commit>`; the image is `linux/amd64`, never QEMU on the arm64 workstation.
- The deploy host runs a pull timer installed from the infra repo (cron every two
  minutes). It pulls the configured services and recreates a container only when
  the digest changed.
- Repo secrets: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`; `NODE_AUTH_TOKEN` only
  when private `@projectfasberry` packages are installed (passed as the BuildKit
  secret `npm_token`).
- Per-stage public URLs for the client bundles come from GitHub repo variables:
  `VITE_API_URL_{PROD,STAGING}`, `VITE_APP_URL_{PROD,STAGING}`,
  `VITE_PANEL_API_URL_{PROD,STAGING}` for minotaur, and
  `NEXT_PUBLIC_SITE_URL_{PROD,STAGING}` for wiki. Shared minotaur values (`VITE_LANDING_URL`, `VITE_VOLUME_URL`,
  `VITE_CAP_URL`, ...) are optional; the workflows carry safe defaults.
- There is no ssh/scp/docker path to the host from this repo. Host-side changes
  (Traefik, Zot, compose files, cron install) belong to the infra repo.
- Rollback pins `:sha-<commit>` in the host compose file.
- `apps/taurus` is a Cloudflare Worker and still deploys manually with
  `wrangler deploy`; it is not part of the pull-based image path.

## Environment & Secrets

Environment variables are securely injected via **Infisical**.
- Do not add `.env` files with real secrets to the repository.
- Prefix commands requiring secrets with `infisical run --env=[environment] --path=/app -- [command]`.
- For staging or production builds, always verify that the Infisical project variables are correctly set in the dashboard.

## Dependency Management

- We use **Bun** (>= 1.3) as the primary runtime and package manager within scripts, while the workspace is likely managed by `pnpm` (based on release scripts). Ensure you do not mix lockfiles.
- Be cautious when upgrading core libraries:
  - `vike` / `vike-react`
  - `react` / `react-dom` (Version 19+)
  - `@reatom/*` (State management)
- After upgrading dependencies, verify SSR still functions via `pnpm build:staging` and `pnpm start:staging`.
