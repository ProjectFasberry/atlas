# AGENTS.md - working in minotaur

Minotaur is the Fasberry web app (`app.fasberry.fun`) built on Vike + React 19,
Reatom v3, Tailwind v4 and Ark UI. This file is the entry point for agents; the
detailed rules live in `agents/` and are linked below.

## Hard rules

- **No React state/effect hooks in feature code.** Do not use `useState`,
  `useEffect`, `useReducer`, `useMemo`, `useCallback`, `useRef` or custom hooks.
  State, effects, forms and async work belong to Reatom atoms/actions. `useAtom`,
  `useUpdate` and `reatomComponent` from `@reatom/npm-react` are the sanctioned
  bindings. Framework/library integration hooks are allowed only at the
  boundary: `usePageContext`/`useConfig` (Vike), `useEditor`/`useEditorState`
  (TipTap), `useInView` (react-intersection-observer). Never use them for
  feature state. Existing UI primitives may use React hooks internally; do not
  copy that pattern into new feature code.
- **Pages are thin.** A `+Page.tsx` renders one feature component from
  `shared/components/**`; it must not contain business logic, fetching or a
  large tree. Put the state in a sibling `*.model.ts`.
- **One feature = model + component + page.** Views read atoms, components
  render, models own state/API/validation. Do not fetch inside JSX or event
  handlers.
- **Use the shared API client.** `client` (main API) and `panelClient` (panel
  API) from `shared/lib/client-wrapper`; never raw `fetch`. Types come from the
  generated OpenAPI schemas; never hand-write response shapes when an operation
  exists.
- **Use `shared/ui`.** Button, Input, Typography, Table, Dialog, Select, Switch,
  Checkbox, Tabs, Tooltip, Skeleton, PageLoader, ErrorBlock, Avatar, Icon. Do not
  add another UI library without an explicit request.
- **Localize everything.** User-facing text lives in `messages/{ru,en}.json`
  (base `ru`) and is read through `translate[...]` or paraglide `m`. No hardcoded
  Russian/English strings in new views.
- **Never edit generated files** - `paraglide/`, `shared/types/gen/`,
  `dist/`, `shared/types/gen/icon/sprite.gen.ts`. Regenerate them.
- **Private routes need a guard.** Add `+guard.ts` with the route's own
  permission and mirror the same permission in the sidebar. The client guard is
  UX only; the API enforces access.
- **Never commit, push or deploy without an explicit request.** Stage only your
  scope; the tree may contain another task's work.
- **Secrets never enter the repo.** Env values come from Infisical at build/dev
  time.

## Documentation map

| Topic | File |
| --- | --- |
| Pages, layouts, components, SSR views | [`agents/views.md`](./agents/views.md) |
| Reatom models, atoms, async, forms, SSR | [`agents/models.md`](./agents/models.md) |
| API clients, generated types, errors | [`agents/data-api.md`](./agents/data-api.md) |
| Tailwind, `tv`, UI primitives, dialogs | [`agents/ui-styling.md`](./agents/ui-styling.md) |
| Routes, guards, permissions, auth | [`agents/routing-auth.md`](./agents/routing-auth.md) |
| Paraglide and message files | [`agents/i18n.md`](./agents/i18n.md) |
| Commands, checks, deploy, generated files | [`agents/checks-deploy.md`](./agents/checks-deploy.md) |
| Canonical snippets | [`agents/examples.md`](./agents/examples.md) |

## Quick checklist before finishing

1. `pnpm --filter minotaur type-check` (runs the sprite patch + `tsc --build`).
2. `pnpm --filter minotaur lint`.
3. `pnpm --filter minotaur circular-check` when models/components changed.
4. No React hooks added, no generated file edited, all strings localized.
5. Private page has a guard and a sidebar entry with the same permission.
