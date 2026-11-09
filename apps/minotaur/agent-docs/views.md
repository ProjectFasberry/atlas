# Views

How pages, layouts and feature components are built in minotaur.

## Routing files (Vike)

The route tree is the `pages/` tree. A route directory may contain:

| File | Purpose |
| --- | --- |
| `+Page.tsx` | Page component; default export. Keep it thin. |
| `+title.ts` | `export default wrapTitle("...")`; the browser title suffix. |
| `+guard.ts` | Server-side permission guard; `throw redirect(...)` when denied. |
| `+config.ts` | Page config, usually `export default { ssr: true }`. |
| `+Layout.tsx` | Layout shared by child routes (e.g. the private panel). |
| `+data.ts` | Server data / metadata for prerendering; uses `vike-react/useConfig`. |
| `+Wrapper.tsx` / `+Head.tsx` | Only when the route family needs a custom shell. |
| `@param/` | Dynamic segment, e.g. `pages/news/@id/`. |

Rules:

- `+Page.tsx` must be a one-liner render of a component, not a god component.
  Move the tree to `shared/components/app/<feature>/components/`.
- Route-local helpers may live next to the page, but shared code goes under
  `shared/`.
- Do not invent a new routing convention; follow the existing Vike files.

## Feature component

A feature component is a normal React function component (or `reatomComponent`
when it reads atoms reactively) that:

- reads state via `useAtom`/`reatomComponent`/`useUpdate` from
  `@reatom/npm-react`;
- dispatches actions from the model;
- renders `shared/ui` primitives;
- has no `useState`/`useEffect`/`useMemo`/`useCallback`/`useRef`.

`reatomComponent` is preferred for components that subscribe to atoms. Plain
components are fine for pure presentation and accept props.

## Private panel pages

Private routes live under `pages/private/`:

```tsx
// pages/private/servers/+Page.tsx
import { Servers } from "@/shared/components/app/private/components/servers";
import { SectionWrapper, WithHeader } from "@/shared/components/app/private/components/ui";

export default function Page() {
  return (
    <SectionWrapper className="flex flex-col gap-3 w-full h-full">
      <WithHeader title="Servers" />
      <Servers />
    </SectionWrapper>
  );
}
```

- Wrap the content in `SectionWrapper` + `WithHeader` for consistent spacing.
- The `pages/private/+Layout.tsx` already renders the sidebar.
- Add `+title.ts` and `+guard.ts` for every private page.
- Add the sidebar entry in
  `shared/components/app/private/components/sidebar.tsx` with the same
  permission as the guard.

## SSR

- The app is SSR by default (`+config.ts` `ssr: true`).
- Server-only data comes from the page context/snapshot, not from `window`.
- Use `+data.ts` for metadata; use models and `withSsr` for state that must
  survive the server-to-client boundary.
- Never touch `window`, `document`, `localStorage` at module scope; guard with
  `ENVIRONMENT` from `shared/consts` or `import.meta.env`.

## Loading and errors

Every async view shows three states:

- first load: `PageLoader` (or `Skeleton` for a section);
- error: `ErrorBlock` with a readable title; mutations also use
  `notifyAboutRestrictRole`/`toast`;
- empty: an explicit empty state, not a blank area.

## Do not

- Do not put API calls, validation or permission checks in a view.
- Do not duplicate a page's logic in a component; page = route shell only.
- Do not use raw `fetch`, `document` queries or manual DOM manipulation.
- Do not add a second state system (React context, Zustand, Redux, signals).
