# Canonical examples

Copy the shape, not the wording.

## Page + `+data`

```tsx
// pages/news/+data.tsx
import { useConfig } from "vike-solid/useConfig";
import type { PageContextServer } from "vike/types";
import { getUrl, wrapTitle } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { mainClient } from "@/shared/api/client";

export type Data = { items: { id: number; title: string }[] }

export async function data(pageCtx: PageContextServer) {
  const config = useConfig()
  const response = await mainClient
    .GET("/news/list", { params: { query: { limit: 3 } }, headers: pageCtx.headers })
    .catch(() => null)

  config({
    title: wrapTitle(translate["news.title"]()),
    description: translate["news.subtitle"](),
    Head: <link rel="canonical" href={getUrl(pageCtx)} />,
  })

  return { items: response?.data?.data?.data ?? [] }
}
```

```tsx
// pages/news/+Page.tsx
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { NewsList } from "./(components)/news-list";

export default function Page() {
  return (
    <MainWrapperPage variant="with_section">
      <NewsList />
    </MainWrapperPage>
  )
}
```

## Model + component

```ts
// pages/news/(models)/news.model.ts
import { reatomAsync, withAbort, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { mainClient } from "@/shared/api/client";

export const news = reatomAsync(async (ctx) => {
  const response = await mainClient.GET("/news/list", {
    params: { query: { limit: 3 } },
    signal: ctx.controller.signal,
  })
  return response.data?.data?.data ?? []
}, "news").pipe(
  withDataAtom([]),
  withStatusesAtom(),
  withErrorAtom(),
  withAbort(),
)
```

```tsx
// pages/news/(components)/news-list.tsx
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { For, Show, onCleanup, onMount } from "solid-js";
import { news } from "../(models)/news.model";

export const NewsList = () => {
  const ctx = useCtx()
  const [items] = useAtom(news.dataAtom)
  const [statuses] = useAtom(news.statusesAtom)

  onMount(() => { if (!statuses().isPending) news(ctx) })
  onCleanup(() => news.abort(ctx))

  return (
    <Show when={!statuses().isPending} fallback={<div>Loading…</div>}>
      <Show when={items().length > 0} fallback={<p>Пока пусто</p>}>
        <For each={items()}>{(item) => <article>{item.title}</article>}</For>
      </Show>
    </Show>
  )
}
```

## Static list + filter atom

```ts
// pages/gallery/(models)/gallery.model.ts
export const galleryState = atom(null, "galleryState").pipe(
  withAssign((_, name) => ({
    filter: atom<"all" | "nature">("all", `${name}.filter`)
  }))
)

export const setGalleryFilter = action(
  (ctx, value: "all" | "nature") => galleryState.filter(ctx, value),
  "setGalleryFilter",
)
```

```tsx
const [filter] = useAtom(galleryState.filter)
const ctx = useCtx()
const visible = () => items.filter((item) => filter() === "all" || item.tag === filter())
```

## Rules for snippets

- Async: `reatomAsync` + `ctx.controller.signal` + data/status/error/abort.
- Fetch once per page in `onMount`; abort in `onCleanup`.
- `useData<Data>()` for SSR data; never fetch the same data in a child.
- `For`/`Show` for rendering; no signals.
- Empty, error and loading states are explicit.
- All text from `translate`; all URLs from helpers.
