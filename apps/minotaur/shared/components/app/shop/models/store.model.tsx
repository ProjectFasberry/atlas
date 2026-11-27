import { reatomAsync, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { action, atom, createCtx } from "@reatom/framework"
import { reatomMap, sleep, withAssign, withConcurrency, withReset } from "@reatom/framework"
import { logError } from '@/shared/lib/log';
import { finalizeSsr } from '@/shared/models/ssr';
import { type PageContextServer } from 'vike/types';
import { client } from '@/shared/lib/client-wrapper';
import { mainClient } from "@/shared/api/client"
import { DEFAULT_SOFT_DELAY } from '@/shared/consts/index';
import { withSearchParamsPersist } from '@reatom/url';
import { withSsr } from "@/shared/models/ssr"
import { pageState } from "@/shared/models/page-context.model"

type StoreCategory = "donate" | "event" | "all"
type StoreWallet = "CHARISM" | "BELKOIN" | "ALL"

// TODO: replace to generated types
export type StoreItemsParams = {
  category: StoreCategory,
  wallet: StoreWallet,
  searchQuery: string | undefined,
  endCursor?: string
}

export type StoreItemsPayload = ExtractApiData<"getStoreItems">["data"]

export async function getStoreItems(params: StoreItemsParams, init?: RequestInit) {
  return client
    .get("/store/items", { ...init, params: { query: params }})
}

export const storeItemsState = atom(null, "storeItemsState").pipe(
  withAssign((_, name) => ({
    data: atom<Nullable<StoreItemsPayload["data"]>>(null, `${name}.data`).pipe(withSsr(`${name}.data`)),
    meta: atom<Nullable<StoreItemsPayload["meta"]>>(null, `${name}.meta`).pipe(withSsr(`${name}.meta`)),
    filters: atom(null, `${name}.filters`).pipe(
      withAssign((_, name) => ({
        category: atom<StoreCategory>("all", `${name}.category`).pipe(
          withSearchParamsPersist('c', (c = "all") => c),
          withReset(),
        ),
        wallet: atom<StoreWallet>("ALL", `${name}.wallet`).pipe(
          withSearchParamsPersist('w', (w = "ALL") => w),
        ),
        searchQuery: atom<string>("", `${name}.searchQuery`).pipe(
          withSearchParamsPersist('sq', (sq = "") => sq),
        ),
        all: reatomMap<string, string>(new Map(), `${name}.all`).pipe(withSsr(`${name}.all`))
      }))
    ),
    /** Ids whose cart mutation is in flight. */
    pending: atom<number[]>([], `${name}.pending`)
  }))
)

storeItemsState.filters.category.onChange((ctx) => storeItems.fetch(ctx))
storeItemsState.filters.wallet.onChange((ctx) => storeItems.fetch(ctx))

export const storeItems = atom(null, "storeItems").pipe(
  withAssign((_, name) => ({
    async init(pageCtx: PageContextServer) {
      const headers = pageCtx.headers;
      if (!headers) return;

      const ctx = createCtx();

      const category = (pageCtx.urlParsed.search["c"] ?? "all") as "all" | "donate" | "event"
      const wallet = (pageCtx.urlParsed.search["w"] ?? "ALL") as "CHARISM" | "BELKOIN" | "ALL"
      const searchQuery = pageCtx.urlParsed.search["sq"] ?? undefined;

      const searchParams = {
        category,
        wallet,
        searchQuery
      }

      const { data, response } = await mainClient.GET("/store/items", {
        params: { query: { category, wallet, searchQuery } },
        headers,
      });

      if (!data) {
        throw new Error("Malformed response");
      }

      const payload = data.data

      // set/update the client_id
      const setCookieValue = response.headers.getSetCookie()

      if (setCookieValue.length >= 1) {
        pageCtx.headersResponse = response.headers
      }

      for (const [origin, val] of Object.entries(searchParams)) {
        storeItemsState.filters.all.set(ctx, origin, val)
      }

      storeItemsState.data(ctx, payload.data);
      storeItemsState.meta(ctx, payload.meta);

      finalizeSsr(ctx, pageCtx)
    },
    fetch: reatomAsync(async (ctx) => {
      const params: StoreItemsParams = {
        category: ctx.get(storeItemsState.filters.category),
        wallet: ctx.get(storeItemsState.filters.wallet),
        searchQuery: ctx.get(storeItemsState.filters.searchQuery)
      }

      return await ctx.schedule(() => getStoreItems(params, { signal: ctx.controller.signal }))
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, { data, meta }) => {
        storeItemsState.data(ctx, data)
        storeItemsState.meta(ctx, meta)
      },
      onReject: (_, e) => logError(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    loadMore: reatomAsync(async (ctx) => {
      const meta = ctx.get(storeItemsState.meta)
      if (!meta?.hasNextPage || !meta.endCursor) return null

      const params: StoreItemsParams = {
        category: ctx.get(storeItemsState.filters.category),
        wallet: ctx.get(storeItemsState.filters.wallet),
        searchQuery: ctx.get(storeItemsState.filters.searchQuery),
        endCursor: meta.endCursor
      }

      return await ctx.schedule(() => getStoreItems(params, { signal: ctx.controller.signal }))
    }, {
      name: `${name}.loadMore`,
      onFulfill: (ctx, payload) => {
        if (!payload) return

        const { data, meta } = payload
        const current = ctx.get(storeItemsState.data) ?? []
        const seen = new Set(current.map((item) => item.id))
        storeItemsState.data(ctx, [
          ...current,
          ...data.filter((item) => !seen.has(item.id))
        ])
        storeItemsState.meta(ctx, meta)
      },
      onReject: (_, e) => logError(e)
    }).pipe(
      withStatusesAtom()
    ),
    setFilter: action((ctx, key: StoreFilterKey, value: string) => {
      if (key === "category") {
        storeItemsState.filters.category(ctx, value as StoreCategory)
        return
      }

      storeItemsState.filters.wallet(ctx, value as StoreWallet)
    }, `${name}.setFilter`),
    setSearch: action((ctx, value: string) => {
      storeItemsState.filters.searchQuery(ctx, value)
      storeItems.fetch(ctx)
    }, `${name}.setSearch`),
    resetFilters: action((ctx) => {
      storeItemsState.filters.category(ctx, "all")
      storeItemsState.filters.wallet(ctx, "ALL")
      storeItemsState.filters.searchQuery(ctx, "")
      storeItems.fetch(ctx)
    }, `${name}.resetFilters`),
    onChangeEvent: action(async (ctx, e: React.ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      storeItemsState.filters.searchQuery(ctx, value)

      await sleep(DEFAULT_SOFT_DELAY)

      storeItems.fetch(ctx)
    }).pipe(
      withConcurrency()
    ),
    setPending: action((ctx, id: number, value: boolean) => {
      storeItemsState.pending(ctx, (state) => {
        if (state.includes(id) === value) return state

        return value ? [...state, id] : state.filter((target) => target !== id)
      })
    }, `${name}.setPending`),
    clearPending: action((ctx) => {
      if (ctx.get(storeItemsState.pending).length === 0) return

      storeItemsState.pending(ctx, [])
    }, `${name}.clearPending`)
  }))
)

export type StoreFilterKey = "category" | "wallet"

const FILTER_DEFAULTS = {
  category: "all",
  wallet: "ALL",
  searchQuery: "",
} as const

/**
 * Single view of the filters for both server and client: the client reads the
 * URL-persisted atoms, the server reads the values `init` stored in the snapshot.
 */
export const storeFiltersAtom = atom((ctx) => {
  if (ctx.spy(pageState.isClientside)) {
    return {
      category: ctx.spy(storeItemsState.filters.category),
      wallet: ctx.spy(storeItemsState.filters.wallet),
      searchQuery: ctx.spy(storeItemsState.filters.searchQuery),
    }
  }

  const all = storeItemsState.filters.all

  return {
    category: (all.get(ctx, "category") ?? FILTER_DEFAULTS.category) as StoreCategory,
    wallet: (all.get(ctx, "wallet") ?? FILTER_DEFAULTS.wallet) as StoreWallet,
    searchQuery: all.get(ctx, "searchQuery") ?? FILTER_DEFAULTS.searchQuery,
  }
}, "storeFilters")
