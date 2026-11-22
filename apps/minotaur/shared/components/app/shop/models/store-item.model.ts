import { reatomAsync, withDataAtom, withInit, withReset, withStatusesAtom } from "@reatom/framework";
import { atom } from "@reatom/framework";
import { client } from "@/shared/lib/client-wrapper";
import { withSsr } from "@/shared/models/ssr";
import { withAssign } from "@reatom/framework";
import { getStoreItems } from "./store.model";
import { appState } from "@/shared/models/app/index.model";

export type StoreItem = ExtractApiData<"getStoreItems">["data"]["data"][number] & {
  command?: string | null;
  refund_cmd?: string | null;
}

export async function getStoreItem(id: string, init: RequestInit) {
  return client.get("/store/item/{id}", {
    ...init,
    params: { path: { id: Number(id) } },
  })
}

export const storeItemState = atom(null, "storeItemState").pipe(
  withAssign((_, name) => ({
    data: atom<StoreItem | null>(null, `${name}.data`).pipe(withSsr(`${name}.data`)),
    isExpanded: atom(false, `${name}.isExpanded`).pipe(
      withInit((ctx, target) => {
        const isMobile = ctx.get(appState.current.isMobile);

        if (!isMobile) {
          return true;
        }

        return target(ctx)
      }),
      withReset(),
      withSsr(`${name}.isExpanded`)
    ),
  }))
)



appState.current.isMobile.onChange((ctx, state) => {
  if (state) {
    storeItemState.isExpanded(ctx, false)
  } else {
    storeItemState.isExpanded(ctx, true)
  }
})

export type RelatedItemsParams = {
  category: "donate" | "event" | "all"
  wallet: string
  excludeId: number
}

/** Four other items from the same category and wallet, for the product page. */
export const relatedItems = atom(null, "relatedItems").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx, params: RelatedItemsParams) => {
      const payload = await ctx.schedule(() => getStoreItems({
        category: params.category,
        wallet: params.wallet as "CHARISM" | "BELKOIN" | "ALL",
        searchQuery: undefined,
      }))

      return payload.data.filter((item) => item.id !== params.excludeId).slice(0, 4)
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withStatusesAtom(),
    ),
  })),
)
