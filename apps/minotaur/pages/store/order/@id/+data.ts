import { type PageContextServer } from "vike/types";
import { useConfig } from 'vike-react/useConfig'
import { logRouting } from "@/shared/lib/log";
import { getOrder } from "@/shared/components/app/shop/models/store-order.model";
import { render } from "vike/abort";
import { getNotExistUrlByEntity } from "@/shared/lib/helpers";

export type OrderSingleGamePayload = {
	unique_id: string;
	initiator: string;
	created_at: Date;
	finished_at: Date | null;
	status: "pending" | "succeeded" | "refunded";
	price: Record<string, number>;
	items: {
		id: number;
		store_item_id: number;
		name: string;
		recipient: string;
		delivery_status?: string;
		revoked_at?: Date | null;
	}[];
};

export type Data = Awaited<ReturnType<typeof data>>;

function metadata(order: OrderSingleGamePayload) {
  return {
    title: `Заказ ${order.unique_id}`
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
