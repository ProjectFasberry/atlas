import { reatomAsync, withStatusesAtom } from "@reatom/framework";
import { atom } from "@reatom/framework";
import { toast } from "sonner";
import { withAssign } from "@reatom/framework";
import { logError } from "@/shared/lib/log";
import { client, withJsonBody } from "@/shared/lib/client-wrapper";
import { navigate } from "vike/client/router";
import type { CreateOrderRoutePayload } from "@/shared/schemas/payment";
import { translate } from "@/shared/locales/helpers";
import { cartState } from "./store-cart.model";
import { balance } from "../../player/models/balance.model";
import type { OrderSingleGamePayload } from "@/pages/store/order/@id/+data";

const getOrderErrorMessage = (message: string) => {
  switch (message.toLowerCase()) {
    case "items-not-found":
      return translate["store.errors.items-not-found"]()
    case "insufficient":
      return translate["store.errors.insufficient"]()
    case "items-already-owned":
      return translate["store.errors.items-already-owned"]()
    default:
      return translate["store.errors.internal"]()
  }
}

export const order = atom(null, "order").pipe(
  withAssign((_, name) => ({
    create: reatomAsync(async () => {
      // The same key is reused by the client's automatic retry, so a lost
      // response cannot charge the player twice.
      return await client
        .post<CreateOrderRoutePayload>("store/order/internal/create", {
          retry: 1
        })
        .pipe(withJsonBody({ idempotencyKey: crypto.randomUUID() }))
        .exec()
    }, {
      name: `${name}.create`,
      onFulfill: (ctx, res) => {
        if (res.skipped && res.skipped.length > 0) {
          toast.info(translate["store.orders.skipped"]({ count: res.skipped.length }))
        }

        cartState.data(ctx, []);
        cartState.price(ctx, { BELKOIN: 0, CHARISM: 0 });
        balance.refetchAll(ctx);

        ctx.schedule(() => navigate(getOrderUrl(res.purchase.uniqueId)))
      },
      onReject: (_, e) => {
        logError(e);

        if (e instanceof Error) {
          toast.error(getOrderErrorMessage(e.message))
        }
      }
    }).pipe(
      withStatusesAtom()
    )
  }))
)

export async function getOrder(id: string, init: RequestInit): Promise<OrderSingleGamePayload> {
  return client
    .get<OrderSingleGamePayload>(`store/order/internal/${id}`, init)
    .exec()
}

export const getOrderUrl = (uniqueId: string) => `/store/order/${uniqueId}`;
export const loaderIsActiveAtom = atom((ctx) => ctx.spy(order.create.statusesAtom).isPending)
