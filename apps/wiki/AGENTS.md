# Agent rules

## Git

- **Ask before every `git commit`, even a local one.** Never commit on your own initiative.
- **Ask before every `git push` to a remote.** A commit is not permission to push.
- One question may cover both steps ("commit and push?"), but only when the user has answered
  it before anything is staged, committed or pushed.
- This rule overrides any earlier instruction to "commit and push the changes" in this project.

## State and logic

- **React hooks are not allowed for business or UI logic.** No `useState`, `useEffect`,
  `useMemo`, `useCallback`, `useReducer` or `useContext` for state.
- Every piece of state and every piece of logic lives in a Reatom model (`@reatom/*`): `atom`,
  `action`, `reatomAsync`, `withAssign`, `onConnect`, `ctx.schedule`. Keep models under
  `shared/models/` or next to the feature they belong to.
- Components only render. Use `reatomComponent` and `ctx.spy`; `useAtom` / `useCtx` from
  `@reatom/npm-react` are for library components that require a hook.
- `useRef` is allowed for DOM access only (focus, measurements, file inputs, editor instance),
  never as a state container.
- Local UI state (open/closed, hover, selected tab, draft text) also goes to atoms, not to
  component state.
- The locale is an atom too: `$locale` in `shared/models/locale.model.ts`, filled once by
  `shared/components/app/locale-sync.tsx` from the server value. No React context.

## Context

Architecture, data, editor and UI documentation for agents lives in `agent-docs/`,
starting at `agent-docs/README.md`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
