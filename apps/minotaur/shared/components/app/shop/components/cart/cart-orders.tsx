import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { type OrdersFilterOption, type OrdersSort, cartOrders, cartOrdersState } from "../../models/store-orders.model"
import { Link } from "@/shared/components/config/link/link"
import { Button } from "@/shared/ui/button"
import { PageLoader } from "@/shared/ui/page-loader"
import { type AtomMut, type Ctx } from "@reatom/framework"
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu"
import { translate } from "@/shared/locales/helpers"
import { dayjs } from "@/shared/lib/dayjs"

const getStatusTitle = (status: string) => {
  switch (status) {
    case "pending": return translate["store.orders.status.processing"]()
    case "succeeded": return translate["store.orders.status.succeeded"]()
    case "refunded": return translate["store.orders.status.refunded"]()
    default: return status
  }
}

function formatPrice(price: Record<string, number>) {
  const parts = Object.entries(price)
    .filter(([, amount]) => Number(amount) > 0)
    .map(([currency, amount]) => `${Number(amount)} ${currency}`)

  return parts.length > 0 ? parts.join(" + ") : "—"
}

const CartOrdersEmpty = () => {
  return (
    <div className="flex flex-col w-full bg-neutral-900 p-2 sm:p-3 lg:p-4 rounded-lg">
      <Typography className='text-2xl font-semibold'>{translate["store.orders.empty.title"]()}</Typography>
      <Typography className="text-neutral-400 text-base leading-5">
        {translate["store.orders.empty.description"]()}
      </Typography>
      <Link href="/store/cart" className="w-fit mt-4 leading-5 text-base text-green-400">
        {translate["store.orders.empty.to-cart"]()}
      </Link>
    </div>
  )
}

type OrdersFilterDropdownProps = {
  label: string;
  options: OrdersFilterOption[];
  currentValue: AtomMut<any>;
  onSelect: (ctx: Ctx, value: string) => void;
}

const OrdersFilterDropdown = reatomComponent<OrdersFilterDropdownProps>(({ ctx, label, options, currentValue }) => {
  const current = ctx.spy(currentValue);
  const activeOption = options.find(o => o.value === current);

  return (
    <Menu.Root
      onSelect={({ value }) => {
        currentValue(ctx, value)
      }}
    >
      <Menu.Trigger asChild>
        <Button background="default" className="truncate min-w-0 py-1">
          {label}: &nbsp;<span className="text-neutral-400">{activeOption?.title}</span>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content className={menuVariant.content()}>
          <Menu.Arrow className={menuVariant.arrow()}>
            <Menu.ArrowTip className={menuVariant.arrowTip()} />
          </Menu.Arrow>
          <div className="flex flex-col gap-1 w-full">
            {options.map((item) => (
              <Menu.Item
                key={item.value}
                value={item.value}
                data-state={current === item.value ? "active" : "inactive"}
                className={menuVariant.item("data-[state=active]:text-green-600 data-[state=inactive]:text-neutral-50")}
              >
                <Typography>
                  {item.title}
                </Typography>
              </Menu.Item>
            ))}
          </div>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
}, "OrdersFilterDropdown");

export const CartOrdersFilters = reatomComponent(({ ctx }) => {
  const order = ctx.spy(cartOrdersState.order)

  return (
    <div id="filters" className="flex flex-wrap items-center gap-2 w-full">
      <OrdersFilterDropdown
        label={translate["store.orders.filters.status"]()}
        options={cartOrdersState.STATUS_OPTIONS}
        currentValue={cartOrdersState.status}
        onSelect={(innerCtx, val) => cartOrdersState.status(innerCtx, val)}
      />
      <OrdersFilterDropdown
        label={translate["store.orders.sort.label"]()}
        options={cartOrdersState.SORT_OPTIONS}
        currentValue={cartOrdersState.sort}
        onSelect={(innerCtx, val) => cartOrdersState.sort(innerCtx, val as OrdersSort)}
      />
      <Button
        background="default"
        className="py-1"
        onClick={() => cartOrdersState.order(ctx, order === "desc" ? "asc" : "desc")}
      >
        {order === "desc"
          ? translate["store.orders.direction.desc"]()
          : translate["store.orders.direction.asc"]()}
      </Button>
    </div>
  )
}, "CartOrdersFilters")

export const CartOrdersList = reatomComponent(({ ctx }) => {
  useUpdate(cartOrders.fetch, [])

  const loading = ctx.spy(cartOrders.fetch.statusesAtom).isPending
  const loadingMore = ctx.spy(cartOrders.loadMore.statusesAtom).isPending
  const data = ctx.spy(cartOrdersState.data)
  const meta = ctx.spy(cartOrdersState.meta)

  if (loading && data.length === 0) return <PageLoader />
  if (data.length === 0) return <CartOrdersEmpty />

  return (
    <div id="content" className='flex flex-col gap-2 rounded-xl bg-neutral-900 p-2 sm:p-3 lg:p-4 w-full h-full'>
      {data.map((order) => (
        <Link
          key={order.unique_id}
          href={`/store/order/${order.unique_id}`}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-neutral-800"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <Typography className="font-semibold truncate text-lg leading-5">
              {translate["store.orders.order"]({ id: order.unique_id })}
            </Typography>
            <Typography className="text-neutral-400 truncate text-sm leading-4">
              {dayjs(order.created_at).format("DD.MM.YYYY HH:mm")}
              {" · "}
              {translate["store.orders.items_count"]({ count: order.items_count })}
            </Typography>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Typography className="font-semibold">{formatPrice(order.price)}</Typography>
            <Typography className="text-neutral-400 text-sm leading-4">
              {getStatusTitle(order.status)}
            </Typography>
          </div>
        </Link>
      ))}

      {meta?.hasNextPage && (
        <Button
          background="default"
          className="self-center py-1"
          disabled={loadingMore}
          onClick={() => cartOrders.loadMore(ctx)}
        >
          {loadingMore ? "..." : "Показать ещё"}
        </Button>
      )}
    </div>
  )
}, "CartOrders")
