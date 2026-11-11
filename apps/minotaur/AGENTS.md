# AGENTS.md - working in minotaur

Minotaur is the Fasberry web app (`app.fasberry.fun`) built on Vike + React 19,
Reatom v3, Tailwind v4 and Ark UI. The rules in
[`atlas/AGENTS.md`](../../AGENTS.md) apply here and take precedence; this file
adds only minotaur specifics.

## Hard rules

- **Bindings.** `reatomComponent`, `useAtom` and `useUpdate` from
  `@reatom/npm-react`; Vike, TipTap and `useInView` are the boundary hooks. See
  the React rules in [`atlas/AGENTS.md`](../../AGENTS.md#react-apps).
- **Pages are thin.** A `+Page.tsx` renders one feature component from
  `shared/components/**`; no business logic, fetching or large tree. State lives
  in a sibling `*.model.ts`.
- **One feature = model + component + page.** Views read atoms, components
  render, models own state/API/validation. Do not fetch inside JSX or event
  handlers.
- **Use the shared API client.** `client` (main API) and `panelClient` (panel
  API) from `shared/lib/client-wrapper`; never raw `fetch`. Types come from the
  generated OpenAPI schemas; never hand-write response shapes when an operation
  exists.
- **Use `shared/ui`.** Do not add another component or styling library without
  an explicit request.
- **Localize everything.** User-facing text lives in `messages/{ru,en}.json`
  (base `ru`) and is read through `translate[...]` or paraglide `m`. No hardcoded
  Russian/English strings in new views.
- **Generated files are off limits**: `paraglide/`, `shared/types/gen/`,
  `shared/types/gen/icon/sprite.gen.ts`, `dist/`. Regenerate them with the app
  scripts.
- **Private routes need a guard.** Add `+guard.ts` with the route's own
  permission and mirror the same permission in the sidebar. The client guard is
  UX only; the API enforces access.

## Docs

Topic guides live in [`agent-docs/`](./agent-docs/README.md): views, models,
data and API, UI and styling, routing and auth, i18n, checks and deploy,
canonical snippets. The pre-flight commands and the deploy path are in
[`agent-docs/checks-deploy.md`](./agent-docs/checks-deploy.md).
