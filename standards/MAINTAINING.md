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

BundleMon records gzipped build output per release for `minotaur`, `wiki` and
`taurus` (client JS/CSS/fonts/images and the server bundle; Docker image size is
not tracked).

- Configs: `apps/<app>/bundlemon.config.cjs`; one BundleMon project covers all
  three apps through `subProject`.
- Required repo/org secrets: `BUNDLEMON_PROJECT_ID` and
  `BUNDLEMON_PROJECT_APIKEY`. Create the project at `app.bundlemon.dev`, then
  read the charts under the project reports (branch `main`, filter by
  subproject).
- `minotaur` and `wiki` upload after the production build on `main`
  (`build-*.yml`); the steps are skipped until the secrets exist.
- `taurus` deploys manually with `wrangler`: `pnpm --filter taurus size` prints
  a local report, `pnpm --filter taurus size:prod` uploads it through
  `infisical run --env=prod --path=/taurus`, and `deploy:all` calls `size:prod`
  automatically. Put `BUNDLEMON_PROJECT_ID`/`BUNDLEMON_PROJECT_APIKEY` in
  Infisical `/taurus`.
- The free hosted BundleMon keeps branch history thinned to one record per day
  after 60 days; self-host it with MongoDB if longer retention is needed.

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
