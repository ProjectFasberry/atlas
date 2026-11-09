# Agent rules

## Git

Follow the repository rules in [`atlas/AGENTS.md`](../../AGENTS.md#hard-rules): ask
before every commit and every push, and never treat a commit as permission to
push.

## State and logic

The React baseline is in
[`atlas/AGENTS.md`](../../AGENTS.md#react-apps): no view-layer state, Reatom
models own state and logic, components only render, refs for DOM only.

Wiki specifics:

- Models live under `shared/models/` or next to the feature they belong to.
- The locale is an atom too: `$locale` in `shared/models/locale.model.ts`, filled
  once by `shared/components/app/locale-sync.tsx` from the server value. No React
  context.
- Naming and provider conventions are in
  [`agent-docs/conventions.md`](agent-docs/conventions.md).

## Context

Architecture, data, editor and UI documentation for agents lives in `agent-docs/`,
starting at `agent-docs/README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
