import { reatomAsync, withStatusesAtom } from "@reatom/framework";
import { action, type Action, atom } from "@reatom/framework";
import { toast } from "sonner";
import { withAssign, withReset } from "@reatom/framework";
import { env } from "@/shared/env";
import { logError } from "@/shared/lib/log";
import { client, withJsonBody } from "@/shared/lib/client-wrapper";
import { navigate } from "vike/client/router";
import { type ReactNode } from "react";
import { type Action as ToasterAction } from "sonner"
import type { OrderSingleDefault } from "@/pages/store/order/@id/+Page";
import type { OrderSinglePayload } from "@/pages/store/order/@id/+data";
import type { CreateOrderRoutePayload, OrderEventPayload } from "@/shared/schemas/payment";
import { translate } from "@/shared/locales/helpers";
import { cartState } from "./store-cart.model";
import { balance } from "../../player/models/balance.model";
import type { OrderSingleGamePayload } from "@/pages/store/order/@id/+data";

export const orderState = atom(null, "orderState").pipe(
  withAssign((_, name) => ({
    es: atom<EventSource | null>(null).pipe(withReset()),
    msg: atom<OrderEventPayload | null>(null, `${name}.msg`),
    disconnectReason: atom<string>("", `${name}.disconnectReason`),
    connectIsSuccess: atom(false, `${name}.connectIsSuccess`),
    requestEvent: atom<OrderEventPayload["type"] | null>(null, `${name}.requestEvent`),
    data: atom<OrderSingleDefault | null>(null, `${name}.data`),
    id: atom<string>("", `${name}.id`)
  }))
)

const getOrderErrorMessage = (message: string) => {
  switch (message.toLowerCase()) {
    case "items-not-found":
      return translate["store.errors.items-not-found"]()
    case "insufficient":
      return translate["store.errors.insufficient"]()
    default:
      return translate["store.errors.internal"]()
  }
}

// Top-up is temporarily unlinked: its page still talks to the removed legacy
// payment endpoints and will be rewritten on top of /payments/invoice.
const ERRORS_EVENTS: Record<string, { cb: () => ToasterAction | ReactNode }> = {}

export const order = atom(null, "order").pipe(
  withAssign((_, name) => ({
    connect: action((ctx, orderId: string) => {
      orderState.id(ctx, orderId);
      orderState.es(ctx, es(getOrderEventsUrl(orderId)))
    }),
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
        createdOrderDataAtom(ctx, res);

        cartState.data(ctx, []);
        cartState.price(ctx, { BELKOIN: 0, CHARISM: 0 });
        balance.refetchAll(ctx);

        ctx.schedule(() => navigate(getOrderUrl(res.purchase.uniqueId, "game")))
      },
      onReject: (_, e) => {
        logError(e);

        if (e instanceof Error) {
          const msg = getOrderErrorMessage(e.message)
          const event = ERRORS_EVENTS[e.message];

          toast.error(msg, {
            action: event ? event.cb() : {} as ToasterAction
          })
        }
      }
    }).pipe(
      withStatusesAtom()
    )
  }))
)

export const es = (url: string) => new EventSource(url, { withCredentials: true });

const MESSAGE_ACTIONS: Record<OrderEventPayload["type"], Action<[], void>> = {
  "invoice_paid": action((ctx) => {
    orderState.data(ctx, (state) => state ? ({ ...state, status: "succeeded" }) : null)

    const es = ctx.get(orderState.es)
    if (!es) return;

    orderState.disconnectReason(ctx, "invoice_paid")
    es.close()
  }),
  "canceled": action((ctx) => {
    orderState.data(ctx, (state) => state ? ({ ...state, status: "canceled" }) : null)
  })
}

orderState.msg.onChange((ctx, target) => {
  if (!target) return;

  const action = MESSAGE_ACTIONS[target.type];
  action(ctx)
  orderState.requestEvent(ctx, target.type)
})

orderState.es.onChange((ctx, target) => {
  if (!target) return;

  target.onopen = () => {
    import.meta.env.DEV && toast.success("Connected to order events")
  }

  target.addEventListener("config", (event) => {
    console.log(event)
  })

  target.addEventListener("ping", (event) => {
    import.meta.env.DEV && toast.info("Ping")
  })

  target.addEventListener("payload", (event) => {
    try {
      orderState.msg(ctx, JSON.parse(event.data))
    } catch (e) {
      console.error('Failed to parse message data:', event.data, e);
    }
  })
})

export async function getOrder(id: string, init: RequestInit, type: string = "default") {
  if (type === "game") {
    const order = await client
      .get<OrderSingleGamePayload>(`store/order/internal/${id}`, init)
      .exec()

    return { ...order, type: "game" } as OrderSinglePayload
  }

  return client
    .get<OrderSinglePayload>(`store/order/external/${id}`, {
      ...init, searchParams: { type }
    })
    .exec()
}

export const getOrderEventsUrl = (orderId: string) => `${env.VITE_API_URL}/store/order/${orderId}/events`
export const createdOrderDataAtom = atom<CreateOrderRoutePayload | null>(null)
export const getOrderUrl = (uniqueId: string, t: string = "default") => `/store/order/${uniqueId}?type=${t}`
export const loaderIsActiveAtom = atom((ctx) => ctx.spy(order.create.statusesAtom).isPending)
