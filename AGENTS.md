# AGENTS.md - working in atlas

Monorepo with several web apps and shared packages. Every app is an independent
deployable with its own stack, build and deploy path. Read the app's README and
agent docs before changing it; read `standards/MAINTAINING.md` for repo-wide
scripts.

## Hard rules

- **Never commit, push, merge or deploy without an explicit request.** Ask about
  scope first: the working tree may contain another task's changes.
- **One package manager.** The workspace uses `pnpm` and `pnpm-lock.yaml`; never
  add npm/yarn lockfiles. Apps whose scripts call `bun` run them with bun - use
  what the app's `package.json` declares.
- **Secrets stay out of the repo, logs and images.** Environment secrets come
  from Infisical; private packages need a token passed as a BuildKit secret or a
  local env var, never as `ARG`/`ENV` and never committed.
- **Deploy only on an explicit request**, using the app's documented path. Do not
  invent a deploy step or ship from a dirty tree without confirming what ships.
- **Do not edit generated files** - Paraglide output, generated icon sprites,
  `dist` and similar build artifacts. Regenerate them with the app's script.

## Layout

- `apps/*` - deployable apps. Each has its own README/docs, build, checks and
  deploy; app-specific agent rules live next to the app.
- `pkgs/*` - shared packages (configs, UI, shared libs). Consume them through
  workspace dependencies, never through relative paths into another workspace.
  App-local aliases are declared in that app's tsconfig/vite config.
- `standards/` - repo-wide conventions: maintaining, architecture and Linear.

## Commands

```bash
pnpm install
pnpm --filter <app> dev
pnpm --filter <app> type-check
pnpm --filter <app> lint
pnpm type-check        # every workspace that defines the script
```

Prefer the app's own scripts: some apps use bun, some have e2e suites. A root
`pnpm <script>` runs that script in every workspace where it exists; use the
filter for one app.

## Checks before finishing

- Type-check and lint the app you touched; run its e2e when the change covers a
  tested flow.
- Generated code may need regeneration before type-check; follow the app docs.
- Lefthook hooks call `node`. If Node is missing, ask before bypassing the hooks;
  do not silently disable them.
- Generated API types and contracts are not hand-edited: change the source and
  regenerate.

## Deploy

- Only when asked, per app. Each app documents its own build and rollout; follow
  that path and verify the health/status endpoint afterwards.
- Remove temporary tokens and build files from hosts when done; never leave a
  credential behind.
- Report the image/build digest or deployment result, not just "deployed".

## Issue tracking

Work is tracked in Linear (project Fasberry); the label and priority convention
is in `standards/LINEAR.md`. Agent-created issues get `AI` plus the app label;
audit batches include mid severity and above unless asked otherwise.

## Commits

Conventional commits, short and lowercase. Ask before committing, stage only your
scope, and leave unrelated changes in the tree untouched.
