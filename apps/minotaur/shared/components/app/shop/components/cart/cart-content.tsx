import { reatomComponent, useUpdate } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import {
  cartIsValidAtom, cartDataSelectedAtom, cartState,
  cartDataIsEmptyAtom
} from "../../models/store-cart.model";
import { CartPrice } from "./cart-price";
import { Link } from "@/shared/components/config/link/link";
import { Button } from "@/shared/ui/button";
import { spawn } from "@reatom/framework";
import { CartItem } from "./cart-item";
import { ChangeRecipientDialog } from "../recipient/change-recipient";
import { Icon } from "@/shared/ui/icon"
import { order } from "../../models/store-order.model";
import { cart } from "../../models/store-cart.model";
import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model";
import { StoreItem } from "../items/store-item";
import { getCurrencies } from "@/shared/models/shared.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { translate } from "@/shared/locales/helpers";

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
          {currency}
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

const CartSuggestions = reatomComponent(({ ctx }) => {
  useUpdate((ctx) => { cart.suggestions(ctx) }, [])

  const suggestions = ctx.spy(cart.suggestions.dataAtom)
  const pending = ctx.spy(cart.suggestions.statusesAtom).isPending

  if (pending && !suggestions) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-56 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!suggestions?.length) return null

  return (
    <div className="flex flex-col gap-3">
      <Typography className="text-lg font-semibold">
        {translate["cart.suggestions.title"]()}
      </Typography>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {suggestions.map((item) => <StoreItem key={item.id} {...item} />)}
      </div>
    </div>
  )
}, "CartSuggestions")

const CartStatus = reatomComponent(({ ctx }) => {
  const price = ctx.spy(cartState.price);

  if (!price.server || (price.available && price.purchasable)) return null

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-2 rounded-lg
        bg-red-500/10 px-3 py-2 text-xs text-red-300"
    >
      <span className="flex items-center gap-1.5">
        <Icon name="sprite:ban" className="size-4 shrink-0" />
        {price.available
          ? translate["cart.status.insufficient"]()
          : translate["cart.status.unavailable"]()}
      </span>
      {price.available && (
        <Link href="/store" className="font-semibold text-red-200 hover:text-white">
          {translate["cart.status.topUp"]()}
        </Link>
      )}
    </div>
  )
}, "CartStatus")

const CartServerSelect = reatomComponent(({ ctx }) => {
  const server = ctx.spy(cartState.server)
  const pending = ctx.spy(cart.setServer.statusesAtom).isPending

  return (
    <div className="flex items-center justify-between gap-2 text-xs text-neutral-400">
      <span>{translate["cart.server.title"]()}</span>
      <div className="flex items-center gap-1">
        {["bisquite", "muffin"].map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            aria-pressed={server === value}
            onClick={() => { if (server !== value) void cart.setServer(ctx, value) }}
            className={`rounded-lg px-2 py-1 text-xs font-semibold capitalize duration-150
              ${server === value
                ? "bg-neutral-50 text-neutral-950"
                : "bg-neutral-800 text-neutral-400 hover:text-neutral-100"
              }`}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  )
}, "CartServerSelect")

const CartActionsSubmit = reatomComponent<{ className?: string }>(({ ctx, className = "" }) => {
  const isValid = ctx.spy(cartIsValidAtom);
  const price = ctx.spy(cartState.price);
  const isPending = ctx.spy(order.create.statusesAtom).isPending;

  return (
    <Button
      id="submit"
      type="button"
      background="positive"
      disabled={!isValid || !price.available || !price.purchasable || isPending}
      withSpinner
      isLoading={isPending}
      className={`w-full h-10 font-semibold ${className}`}
      onClick={() => spawn(ctx, (spawnCtx) => order.create(spawnCtx))}
    >
      {translate["cart.content.submit"]()}
    </Button>
  )
}, "CartActionsSubmit")

const CartOrderError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(order.create.errorAtom);
  if (!error) return null

  return (
    <Typography className="text-xs text-red-300" role="alert">
      {error.message || translate["cart.error"]()}
    </Typography>
  )
}, "CartOrderError")

const CartTrust = () => (
  <ul className="flex flex-col gap-1.5 text-xs text-neutral-400">
    {[
      ["sprite:check", "cart.trust.delivery"],
      ["sprite:telegram-icon", "cart.trust.support"],
      ["sprite:shield-half", "cart.trust.refund"],
    ].map(([icon, key]) => (
      <li key={key} className="flex items-center gap-2">
        <Icon name={icon as "sprite:check"} className="size-3.5 shrink-0 text-green-400" />
        {translate[key as "cart.trust.delivery"]()}
      </li>
    ))}
  </ul>
)

export const CartListContent = reatomComponent(({ ctx }) => {
  const isEmpty = ctx.spy(cartDataIsEmptyAtom);
  if (isEmpty) {
    return (
      <div className="flex w-full flex-col gap-6 lg:w-2/3">
        <CartContentEmpty />
        <CartSuggestions />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 rounded-xl bg-neutral-900 p-3 sm:p-4 lg:w-2/3">
      <CartListHeader />
      <CartContentData />
    </div>
  )
}, 'CartListContent')

export const CartActions = reatomComponent(({ ctx }) => {
  if (ctx.spy(cartDataIsEmptyAtom)) return null

  return (
    <>
      <aside className="flex w-full flex-col gap-4 rounded-xl bg-neutral-900
        p-3 sm:p-4 lg:sticky lg:top-24 lg:w-1/3">
        <Typography className="text-xl font-semibold">
          {translate["cart.summary.title"]()}
        </Typography>
        <CartServerSelect />
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-sm text-neutral-400">
            {translate["cart.content.price"]()}
          </Typography>
          <CartPrice />
        </div>
        <CartStatus />
        <CartOrderError />
        <CartActionsSubmit className="hidden lg:flex" />
        <CartTrust />
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t
        border-neutral-800 bg-neutral-950/95 px-4
        pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <CartPrice />
          <CartActionsSubmit className="w-auto min-w-40" />
        </div>
      </div>
    </>
  )
}, "CartActions")

export { CartSuggestions }
