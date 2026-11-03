import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { type OrdersFilterOption, cartOrders, cartOrdersState } from "../../models/store-orders.model"
import { Link } from "@/shared/components/config/link/link"
import { Button } from "@/shared/ui/button"
import { PageLoader } from "@/shared/ui/page-loader"
import { type AtomMut, type Ctx } from "@reatom/framework"
import { Menu } from '@ark-ui/react/menu'
import { menuVariant } from "@/shared/ui/menu"
import { translate } from "@/shared/locales/helpers"

const getStatusTitle = (status: string) => {
  switch (status) {
    case "pending": return translate["store.orders.status.pending"]()
    case "succeeded": return translate["store.orders.status.succeeded"]()
    case "canceled": return translate["store.orders.status.canceled"]()
    case "waitingForCapture": return translate["store.orders.status.waiting-for-capture"]()
    default: return status
  }
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
    <div>
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
    </div>
  );
}, "OrdersFilterDropdown");

export const CartOrdersList = reatomComponent(({ ctx }) => {
  useUpdate(cartOrders.fetch, [])

  if (ctx.spy(cartOrders.fetch.statusesAtom).isPending) return <PageLoader />

  const data = ctx.spy(cartOrders.fetch.dataAtom)
  if (!data) return <CartOrdersEmpty />

  const getOrderLink = (uniqueId: string) => {
    // "all" and "default" both list external orders, only "game" uses internal ones.
    const type = ctx.get(cartOrdersState.type) === "game" ? "game" : "default";

    return `/store/order/${uniqueId}?type=${type}`
  }

  return (
    <div id="content" className='flex flex-col gap-2 rounded-xl bg-neutral-900 p-2 sm:p-3 lg:p-4 w-full h-full'>
      {data.map((order) => (
        <Link
          key={order.unique_id}
          href={getOrderLink(order.unique_id)}
          className="flex items-center justify-between w-full p-4 rounded-lg border border-neutral-800"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <Typography className="font-semibold truncate text-lg leading-5">
              {translate["store.orders.order"]({ id: order.unique_id })}
            </Typography>
            <Typography className="text-neutral-400 truncate text-sm leading-4">
              {getStatusTitle(order.status)}
            </Typography>
          </div>
        </Link>
      ))}
    </div>
  )
}, "CartOrders")

export const CartOrdersFilters = () => {
  return (
    <div id="filters" className="flex items-center gap-2 w-full">
      <OrdersFilterDropdown
        label={translate["store.orders.filters.status"]()}
        options={cartOrdersState.STATUS_OPTIONS}
        currentValue={cartOrdersState.status}
        onSelect={(ctx, val) => cartOrdersState.status(ctx, val)}
      />
      <OrdersFilterDropdown
        label={translate["store.orders.filters.type"]()}
        options={cartOrdersState.TYPE_OPTIONS}
        currentValue={cartOrdersState.type}
        onSelect={(ctx, val) => cartOrdersState.type(ctx, val)}
      />
    </div>
  )
}
