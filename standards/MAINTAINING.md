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
