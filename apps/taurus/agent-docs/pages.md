# Pages and routing

Vike file routing under `pages/`. Directories in parentheses — `(components)`,
`(models)` — are route-local code, not routes.

## Route files

| File | Use |
| --- | --- |
| `+Page.tsx` | Route component. Keep thin: shell + feature component. |
| `+data.tsx` | Server data, title/description, `Head` overrides. |
| `+Layout.tsx` | Only if the route family needs a different shell. |
| `_error/+Page.tsx` | Global error page. |

Public routes today: `/`, `/rules`, `/support`, `/gallery`, `/modpack`,
`/status`, `/start`, `/info/*`. Redirects are centralized in
`renderer/+config.ts`; do not add redirects elsewhere.

## `+data.tsx`

```tsx
export async function data(pageCtx: PageContextServer) {
  const config = useConfig()
  const data = await mainClient.GET("/news/list", { headers: pageCtx.headers })

  config({
    title: wrapTitle(translate["pages.index.title"]()),
    description: translate["pages.index.description"](),
    Head: <link rel="canonical" href={getUrl(pageCtx)} />,
  })

  return { data: data.data?.data ?? [] }
}
```

- Use `useConfig` from `vike-solid/useConfig`, `getUrl`/`wrapTitle` from
  `shared/lib/helpers`, `translate` for strings.
- Return a plain object; components read it with `useData<Data>()`.
- Catch API failures and return an explicit `failed`/empty value. Never throw
  for an optional block.
- Pass `pageCtx.headers` to API calls that need request cookies.
- Do not set `document.title` in components.

## SSR and client

- `renderer/+config.ts` sets `ssr: true` and passes `snapshot` to the client.
  Keep it that way unless the whole page is client-only.
- `renderer/+Layout.tsx` owns the Reatom provider, header, footer, toaster and
  global styles. Do not duplicate them in a page.
- No `window`, `document`, `localStorage` or `Date`-dependent markup at module
  scope. Use `onMount`, `pageState.isClient` or an atom.
- `renderer/+server.ts` is Hono + Paraglide middleware; `+lang.ts` sets
  `<html lang>`. Locale is request-scoped; do not overwrite it globally.

## Section layout

- Full-page sections: `sectionVariant()` + `sectionVariantChild()` from
  `shared/styles/variants`.
- Content pages use `MainWrapperPage variant="with_section"` and a
  `full-screen-section` content block; do not invent a second page shell.
- The landing wrapper adds `landing-page`; its internal edges are defined in
  `shared/styles/tailwind.css`. Do not change global section borders for one
  page.
- `responsive` is the standard width wrapper; use it instead of ad-hoc
  `w-[90%]` values.

## States

Every async block renders three states:

- loading: `Skeleton` (sections) or a dedicated skeleton;
- error: readable message + retry;
- empty: explicit copy, not a blank area.

## Don'ts

- No API calls in `+Page.tsx`; put them in `+data.tsx` or a Reatom model.
- No business state in components, no `createSignal`/`createStore` for UI state.
- No raw `<a>` for internal routes; use `shared/components/link`.
- No per-page `<head>` duplication; extend `+data.tsx`.
