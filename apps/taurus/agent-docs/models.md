# Models and state

State, async work and UI flags live in Reatom models. Components render and
dispatch only.

## Hard rules

- No `createSignal`, `createStore`, Solid context or refs for business/UI state.
  Open/closed, filters, tabs, drafts and selected items are atoms too.
- Models live in `pages/<route>/(models)/<name>.model.ts` or `shared/models/`
  for cross-page state.
- Name every atom/action: `atom(init, "name")`, actions `"name.action"`, derived
  atoms `` `${name}.fetch` ``.
- No side effects at module scope. Fetch in `onMount`/actions; abort in
  `onCleanup`.
- `createMemo` is allowed for derived render values; `onMount`/`onCleanup` for
  lifecycle. `createEffect` only for framework integration (page context sync,
  third-party widgets), never for feature state.

## Reading state

```tsx
const [items] = useAtom(newsList.dataAtom)
const [statuses] = useAtom(newsList.statusesAtom)

return <Show when={!statuses().isPending}>{items().length}</Show>
```

- `useAtom(atom)` returns `[accessor, updater?, atom]`.
- Read the accessor in JSX (`items()`), not once into a plain variable.
- `useCtx()` gives the bound context for actions and async calls.
- `ctx.spy` is not used in taurus; prefer `useAtom`.

## Async

```ts
export const newsList = reatomAsync(async (ctx) => {
  const response = await mainClient.GET("/news/list", {
    params: { query: { limit: 3, content: false } },
    signal: ctx.controller.signal,
  })
  return response.data?.data?.data ?? []
}, "newsList").pipe(
  withDataAtom([]),
  withStatusesAtom(),
  withErrorAtom(),
  withAbort(),
)
```

- Use `withAbort` and pass `ctx.controller.signal`.
- `withStatusesAtom` drives pending/loaded UI; `withErrorAtom` for retry.
- `withCache` only for repeated reads; clear/refetch after mutations.
- Do not fetch in a component; call the model action from `onMount` and abort
  in `onCleanup`:

```tsx
onMount(() => { if (!statuses().isPending) newsList(ctx) })
onCleanup(() => newsList.abort(ctx))
```

## SSR

- `shared/models/ssr.ts` exposes `snapshotAtom`; `withSsr("key")` persists an
  atom across the server render and hydration.
- `renderer/+Layout.tsx` creates the Reatom context, restores the snapshot and
  syncs `pageState`.
- Client-only markup uses `pageState.isClient`; never read browser APIs during
  SSR.
- Locale is request-scoped (`appState.locale`). Do not write it globally.

## Shared models

`shared/models/server-status.model.ts` owns `/server/status` and player
avatars. The `/status` page and landing reuse it. Do not create a second status
fetcher.

## Actions

- `action((ctx, ...args) => ..., "name")` for mutations.
- One action per user intent; no `setX` wrappers around `atom(ctx, value)` unless
  it is reused.
- Reset search/filter atoms on page mount if stale state would confuse the next
  visit.
- Async failures surface through `errorAtom`; do not swallow them.
