import { client, withQueryParams } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import { action, atom, reatomAsync, withAssign, withStatusesAtom } from "@reatom/framework";
import { withSearchParamsPersist } from "@reatom/url";
import { translate } from "@/shared/locales/helpers";

export type OrdersFilterOption = { title: string; value: string };
export type OrdersSort = "date" | "amount";
export type OrdersDirection = "asc" | "desc";

export type GameOrder = {
  unique_id: string;
  initiator: string;
  created_at: string;
  finished_at: Nullable<string>;
  status: "pending" | "succeeded" | "refunded";
  price: Record<string, number>;
  items_count: number;
};

type GameOrdersPage = {
  data: GameOrder[];
  meta: { hasNextPage: boolean; endCursor?: string };
};

const PAGE_SIZE = 20;

export const cartOrdersState = atom(null, "cartOrdersState").pipe(
  withAssign((_, name) => ({
    status: atom<string>("all", `${name}.status`).pipe(
      withSearchParamsPersist("status", (d = "all") => d),
    ),
    sort: atom<OrdersSort>("date", `${name}.sort`).pipe(
      withSearchParamsPersist("sort", (d = "date") => d as OrdersSort),
    ),
    order: atom<OrdersDirection>("desc", `${name}.order`).pipe(
      withSearchParamsPersist("order", (d = "desc") => d as OrdersDirection),
    ),
    data: atom<GameOrder[]>([], `${name}.data`),
    meta: atom<Nullable<GameOrdersPage["meta"]>>(null, `${name}.meta`),
    get STATUS_OPTIONS(): OrdersFilterOption[] {
      return [
        { title: translate["store.orders.filters.all"](), value: "all" },
        { title: translate["store.orders.status.pending"](), value: "pending" },
        { title: translate["store.orders.status.succeeded"](), value: "succeeded" },
      ];
    },
    get SORT_OPTIONS(): OrdersFilterOption[] {
      return [
        { title: translate["store.orders.sort.date"](), value: "date" },
        { title: translate["store.orders.sort.amount"](), value: "amount" },
      ];
    },
  }))
);

const refetch = action((ctx) => cartOrders.fetch(ctx));

cartOrdersState.status.onChange(refetch);
cartOrdersState.sort.onChange(refetch);
cartOrdersState.order.onChange(refetch);

function queryParams(ctx: Parameters<typeof cartOrdersState.status>[0]) {
  const status = ctx.get(cartOrdersState.status);

  return {
    sort: ctx.get(cartOrdersState.sort),
    order: ctx.get(cartOrdersState.order),
    limit: PAGE_SIZE,
    ...(status === "all" ? {} : { status }),
  };
}

export const cartOrders = atom(null, "cartOrders").pipe(
  withAssign((_, name) => ({
    refetchAll: action((ctx) => {
      cartOrdersState.meta(ctx, null);
      cartOrdersState.data(ctx, []);
      cartOrders.fetch(ctx);
    }),
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client<GameOrdersPage>("store/order/internal/list")
          .pipe(withQueryParams(queryParams(ctx)))
          .exec()
      );
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, page) => {
        cartOrdersState.data(ctx, page.data);
        cartOrdersState.meta(ctx, page.meta);
      },
      onReject: (_, e) => logError(e),
    }).pipe(withStatusesAtom()),
    loadMore: reatomAsync(async (ctx) => {
      const meta = ctx.get(cartOrdersState.meta);
      if (!meta?.endCursor) return null;

      return await ctx.schedule(() =>
        client<GameOrdersPage>("store/order/internal/list")
          .pipe(withQueryParams({ ...queryParams(ctx), endCursor: meta.endCursor }))
          .exec()
      );
    }, {
      name: `${name}.loadMore`,
      onFulfill: (ctx, page) => {
        if (!page) return;

        cartOrdersState.data(ctx, (current) => [...current, ...page.data]);
        cartOrdersState.meta(ctx, page.meta);
      },
      onReject: (_, e) => logError(e),
    }).pipe(withStatusesAtom()),
  }))
);
