# Fasberry Wiki

Project wiki at `https://wiki.fasberry.fun`: server mechanics, economy and
accounts. Articles live in PostgreSQL and are rendered on every request, so an
edit shows up immediately.

## Stack

Next.js 16 (App Router), React 19, Fumadocs, Drizzle ORM over PostgreSQL, TipTap,
Reatom for state, `ky` for HTTP. Node 22 or newer.

## Running

```bash
pnpm install
export DATABASE_URL=postgres://user:pass@host:5432/general
pnpm sync:wiki   # or pnpm db:import for a local snapshot
pnpm dev         # http://localhost:3000
```

Migrations from `drizzle/` run on start, so an empty database needs no setup.
Content commands and storage are in [`agent-docs/data.md`](./agent-docs/data.md).

## Deploy

Push to `dev`/`staging` for staging, `main` for prod.
`.github/workflows/build-wiki.yml` builds `linux/amd64` and pushes
`registry.fasberry.fun/<stage>/wiki:latest` plus `:sha-<commit>`; the host pulls
it every two minutes and recreates `prod-app-wiki` only when the digest changed.
`NEXT_PUBLIC_SITE_URL` is baked at build time, database/auth settings are read at
runtime, and rollback pins `:sha-<commit>` in the host compose. Registry, routes
and staging rollout belong to `ProjectFasberry/infra`; the staging image is built
for parity.

## Development

- `pnpm --filter wiki type-check`
- `pnpm --filter wiki test:e2e` (Playwright against a production build)
- `WIKI_EDITOR_OPEN=1 pnpm dev` opens the editor locally.

## Agents

Rules are in [AGENTS.md](./AGENTS.md); architecture, data, editor, i18n, UI,
conventions and deploy notes start at [`agent-docs/`](./agent-docs/README.md).

## Resources

[Next.js](https://nextjs.org/) · [Fumadocs](https://fumadocs.dev) ·
[Drizzle](https://orm.drizzle.team/) · [TipTap](https://tiptap.dev) ·
[Reatom](https://reatom.dev/) · [Paraglide](https://inlang.com/m/gerre34r/library-inlang-paraglideJs)
