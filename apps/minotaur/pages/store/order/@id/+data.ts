import { type PageContextServer } from "vike/types";
import { useConfig } from 'vike-react/useConfig'
import { logRouting } from "@/shared/lib/log";
import { getOrder } from "@/shared/components/app/shop/models/store-order.model";
import { render } from "vike/abort";
import { getNotExistUrlByEntity } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers"
import type { OrderSingleGamePayload } from "@/shared/schemas/payment"

export type Data = Awaited<ReturnType<typeof data>>;

function metadata(order: OrderSingleGamePayload) {
  return {
    title: translate["store.order.page-title"]({ id: order.unique_id })
  }
}

export const data = async (pageCtx: PageContextServer) => {
  logRouting(pageCtx.urlPathname, data.name)

  const config = useConfig()
  const headers = pageCtx.headers ?? undefined

  const order = await getOrder(pageCtx.routeParams.id, { headers }).catch(() => null)
  if (!order) throw render(getNotExistUrlByEntity())

  config(metadata(order))

  return {
    data: order
  }
}
