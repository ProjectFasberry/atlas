import { reatomAsync, withInit, withReset, withStatusesAtom } from "@reatom/framework";
import { action, atom } from "@reatom/framework";
import { cart, cartState } from "./store-cart.model";
import { logError } from "@/shared/lib/log";
import { client } from "@/shared/lib/client-wrapper";
import { withSsr } from "@/shared/models/ssr";
import { withAssign } from "@reatom/framework";
import { type SelectItemToCartOptions, storeItemsState } from "./store.model";
import { invariant } from "@/shared/lib/utils";
import { appState } from "@/shared/models/app/index.model";

export type StoreItem = ExtractApiData<"getStoreItems">["data"]["data"][number] & {
  command?: string | null;
  refund_cmd?: string | null;
}

export async function getStoreItem(id: string, init: RequestInit) {
  return client.raw
    .get<StoreItem>(`/store/item/${id}`, init)
}

type UpdateItemStatusOptions =
  | { patch: Partial<SelectItemToCartOptions> }
  | { remove: true }
  | { set: { isSelected: boolean; isLoading: boolean } }

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

export const storeItem = atom(null, "storeItem").pipe(
  withAssign((_, name) => ({
    add: action((ctx, id: number) => {
      const isSelected = ctx.get(getItemStatus(id))?.isSelected ?? false;

      if (isSelected) {
        cart.removeItem(ctx, id)
        return;
      }

      cart.addItem(ctx, id)
    }, `${name}.add`),
    updateStatus: action((ctx, id: number, options: UpdateItemStatusOptions) => {
      storeItemsState.statuses(ctx, (state) => {
        if (!state) return state;

        const next = { ...state };

        if ('remove' in options && options.remove) {
          delete next[id];
        }

        if ('set' in options) {
          next[id] = options.set;
        }

        if ('patch' in options) {
          if (!next[id]) return state;
          next[id] = { ...next[id], ...options.patch };
        }

        return next;
      });
    }, `${name}.updateStatus`),
    updateSelectedStatus: reatomAsync(async (ctx, id: number) => {
      const current = ctx.get(cartState.data).find(target => target.id === id);
      invariant(current, "Current is not defined")

      const result = await client
        .post("/store/cart/edit/{id}", {
          json: {
            key: "selected",
            value: !current.selected
          },
          params: { path: { id } }
        })

      return { id, result }
    }, {
      name: `${name}.updateSelectedStatus`,
      onFulfill: (ctx, { result, id }) => cart.update(ctx),
      onReject: (_, e) => logError(e, { type: "combined" })
    }).pipe(
      withStatusesAtom()
    )
  }))
)

export const getItemStatus = (id: number) => atom((ctx) => {
  const data = ctx.spy(storeItemsState.statuses)
  if (!data) return null;
  return data[id];
}, `getItemStatus.${id}`)
