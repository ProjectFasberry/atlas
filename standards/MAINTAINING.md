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

- `minotaur`, `taurus` and `wiki` upload after the production build on `main`
  (`build-*.yml`) when `BUILD_METRICS_TOKEN` is set.
- Locally, `pnpm --filter taurus size` prints a report and
  `pnpm --filter taurus size:prod` uploads it.
- Repo secret `BUILD_METRICS_TOKEN` must match the same value in the host
  `glaux` env; glaux also needs `BUILD_METRICS_POSTGRES_URI` pointing at the
  `build_metrics` database.
- The table is created by glaux on boot; the database itself is provisioned on
  the host.

## Build and deploy

Container apps (`minotaur`, `taurus`, `wiki`) are built by GitHub Actions only:

- `.github/workflows/build-<app>.yml` runs on `ubuntu-latest` for push to `main`
  and for manual dispatch; the stage is always `prod`.
- It pushes `registry.fasberry.fun/prod/<app>:latest` and `:sha-<commit>`; the
  image is `linux/amd64`, never QEMU on the arm64 workstation.
- The deploy host runs a pull timer installed from the infra repo (cron every two
  minutes). It pulls the configured services and recreates a container only when
  the digest changed.
- Repo secrets: `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`; `NODE_AUTH_TOKEN` only
  when private `@projectfasberry` packages are installed (passed as the BuildKit
  secret `npm_token`).
- Public URLs for the client bundles come from GitHub repo variables
  (`VITE_API_URL`, `VITE_APP_URL`, `VITE_PANEL_API_URL` for minotaur,
  `NEXT_PUBLIC_SITE_URL` for wiki). Shared minotaur values (`VITE_LANDING_URL`,
  `VITE_VOLUME_URL`, `VITE_CAP_URL`, ...) are optional; the workflows carry safe
  defaults.
- There is no ssh/scp/docker path to the host from this repo. Host-side changes
  (Traefik, Zot, compose files, cron install) belong to the infra repo.
- Rollback pins `:sha-<commit>` in the host compose file.
- `apps/taurus` ships the same way: CI builds `prod/taurus:latest` from
  `apps/taurus/Dockerfile` with `DEPLOY_TARGET=node`, and the host rolls it out.
  `wrangler` remains only a rollback path for the old Worker.

## Local frontends against the production API

Every frontend dev server proxies browser API calls through itself:

- minotaur: `/api` and `/panel-api` in `apps/minotaur/vite.config.ts`;
- taurus: `/api` in `apps/taurus/vite.config.ts`;
- wiki: no browser calls, its API access is server-side and needs no proxy.

The proxy targets the real API, rewrites `Origin` to the production web app
(the API rejects cookie-authenticated mutations from unknown origins), drops the
cookie `Domain` attribute and the `Secure` flag, so the session stays a
first-party `localhost` cookie. The browser only talks to the dev origin: no
CORS, no extra proxy process, no hosts entries or certificates.

Run the usual `pnpm --filter <app> dev` with `VITE_API_URL` /
`PUBLIC_ENV__API_URL` pointing at `https://api.fasberry.fun`.

## Environment & Secrets

Runtime secrets live in the host-only `/opt/main/env/prod/<service>.env` files.
Public build-time values come from GitHub repository variables.
- Do not add `.env` files with real secrets to the repository.
- For a local run, put the keys you need into the app's `.env` (see each app's
  `env.d.ts`); never commit it.

## Dependency Management

- We use **Bun** (>= 1.3) as the primary runtime and package manager within scripts, while the workspace is likely managed by `pnpm` (based on release scripts). Ensure you do not mix lockfiles.
- Be cautious when upgrading core libraries:
  - `vike` / `vike-react`
  - `react` / `react-dom` (Version 19+)
  - `@reatom/*` (State management)
- After upgrading dependencies, verify SSR still functions via `pnpm --filter <app> build:prod` and `start:prod`.
