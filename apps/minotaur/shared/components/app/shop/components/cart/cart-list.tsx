import { reatomComponent } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Link } from "@/shared/components/config/link/link"
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { ChangeRecipientDialog } from "../recipient/change-recipient"
import { CartItem } from "./cart-item"
import { getCurrencies } from "@/shared/models/shared.model"
import {
  cartDataIsEmptyAtom, cartDataSelectedAtom, cartState
} from "../../models/store-cart.model"
import { cart } from "../../models/store-cart.model"
import { translate } from "@/shared/locales/helpers"
import { storeCurrencyLabel } from "../../lib/labels"

const CURRENCY_ORDER = ["BELKOIN", "CHARISM"] as const

const CartCurrencyGroup = reatomComponent<{ currency: string }>(({ ctx, currency }) => {
  const data = ctx.spy(cartState.data).filter((item) => item.currency === currency);
  const currencies = getCurrencies(ctx);
  const info = currencies[currency];
  const selectedTotal = data.reduce((sum, item) => sum + (item.selected ? item.price : 0), 0);

  if (data.length === 0) return null

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between
        gap-2 px-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold
          uppercase tracking-wide text-neutral-500">
          {info?.img ? <img src={info.img} alt="" className="size-4" /> : info?.symbol ?? currency}
          {storeCurrencyLabel(currency)}
        </span>
        <span className="text-xs text-neutral-500">
          {translate["cart.count.items"]({ count: data.length })}
          {" · "}
          {selectedTotal}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((item) => <CartItem key={item.id} {...item} />)}
      </div>
    </section>
  )
}, "CartCurrencyGroup")

const CartContentData = reatomComponent(({ ctx }) => {
  const data = ctx.spy(cartState.data);
  const currencies = [...new Set(data.map((item) => item.currency))];
  const ordered = CURRENCY_ORDER.filter((currency) => currencies.includes(currency));
  const rest = currencies.filter((currency) => !(CURRENCY_ORDER as readonly string[]).includes(currency));

  return (
    <div className="flex flex-col gap-4 w-full">
      <ChangeRecipientDialog />
      {[...ordered, ...rest].map((currency) => (
        <CartCurrencyGroup key={currency} currency={currency} />
      ))}
    </div>
  )
}, "CartContentData")

const CartListHeader = reatomComponent(({ ctx }) => {
  const data = ctx.spy(cartState.data);
  const selected = ctx.spy(cartDataSelectedAtom).length;
  const allSelected = data.length > 0 && selected === data.length;
  const bulkPending = ctx.spy(cart.setAllSelected.statusesAtom).isPending;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography className="text-xl font-semibold">
          {translate["cart.content.title"]()}
        </Typography>
        <div className="flex items-center gap-2">
          <Button
            background="default"
            className="h-8 text-xs font-semibold"
            disabled={bulkPending || data.length === 0}
            onClick={() => cart.setAllSelected(ctx, !allSelected)}
          >
            {allSelected
              ? translate["cart.actions.deselectAll"]()
              : translate["cart.actions.selectAll"]()
            }
          </Button>
          <Button
            background="default"
            className="h-8 text-xs font-semibold text-neutral-400 hover:text-red"
            disabled={ctx.spy(cart.clear.statusesAtom).isPending || data.length === 0}
            onClick={() => alertDialog.open(ctx, {
              title: translate["cart.confirm.clear"](),
              onConfirm: () => cart.clear(ctx),
              errorAtom: cart.clear.errorAtom,
            })}
          >
            {translate["cart.actions.clear"]()}
          </Button>
        </div>
      </div>
      <Typography className="text-sm text-neutral-400" aria-live="polite">
        {translate["cart.summary.selected"]({ count: selected, total: data.length })}
      </Typography>
    </div>
  )
}, "CartListHeader")

const CartContentEmpty = () => {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-4 sm:p-6">
      <Typography className='text-2xl font-semibold'>
        {translate["cart.content.empty.title"]()}
      </Typography>
      <Typography className="text-neutral-400 text-base leading-5">
        {translate["cart.content.empty.description"]()}
      </Typography>
      <Link href="/store" className="w-fit">
        <Button background="white" className="h-10 font-semibold">
          {translate["cart.content.empty.to-store"]()}
        </Button>
      </Link>
    </div>
  )
}

export const CartListContent = reatomComponent(({ ctx }) => {
  if (ctx.spy(cartDataIsEmptyAtom)) {
    return (
      <div className="flex w-full flex-col gap-6 lg:w-2/3">
        <CartContentEmpty />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-neutral-900 p-3 sm:p-4 lg:w-2/3">
      <CartListHeader />
      <CartContentData />
    </div>
  )
}, "CartListContent")
