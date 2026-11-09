## Overview

Project web-app for minecraft server at `https://app.fasberry.fun`: auth and profiles, server control, lands and
worlds, ratings, store, tasks, news and settings.

## Stack

React, Vike, Vite, TypeScript, Bun, Reatom v3, Tailwind CSS v4, Ark UI, TipTap.

## Installation / Setup

See [SETUP.md](./SETUP.md).

## Deploy

Images are built by `.github/workflows/build-minotaur.yml`: push to `main` for
prod, `dev`/`staging` for staging. CI builds on `ubuntu-latest`, pushes
`registry.fasberry.fun/<stage>/minotaur:latest` and `:sha-<commit>`, and the host
pulls it with `fasberry-pull-update.timer` from the `infra` repository. Staging
bakes the `*.alpha.fasberry.fun` URLs.

## Development

- `bun run dev` - dev API through Infisical.
- `bun run dev:prod` - production API; browser calls go through the Vite proxy
  (`/api`, `/panel-api`) to avoid CORS.
- Checks: `bun run type-check`, `bun run lint`, `bun run circular-check`.

## Agents

Rules and architecture notes are in [AGENTS.md](./AGENTS.md) and [`agent-docs/`](./agent-docs).
The typed API client is generated from the OpenAPI schema in
`pkgs/shared/types/gen`; regenerate it with `pnpm openapi:prod`.

## Resources

[Vike](https://vike.dev/) · [React](https://react.dev/) ·
[Tailwind](https://tailwindcss.com/) · [Reatom](https://reatom.dev/) · [Vite](https://vitejs.dev/)
