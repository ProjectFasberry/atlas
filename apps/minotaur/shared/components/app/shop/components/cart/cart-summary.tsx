import { reatomComponent } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Link } from "@/shared/components/config/link/link"
import { order } from "../../models/store-order.model"
import {
  cart, cartDataIsEmptyAtom, cartIsValidAtom, cartState
} from "../../models/store-cart.model"
import { CartPrice } from "./cart-price"
import { translate } from "@/shared/locales/helpers"
import { GAME_SERVERS } from "@/shared/consts/game"

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
        <Link href="/wallet" className="font-semibold text-red-200 hover:text-white">
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
        {GAME_SERVERS.map((value) => (
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
      onClick={() => order.create(ctx)}
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

const TRUST_POINTS = [
  { icon: "sprite:check", label: "cart.trust.delivery" },
  { icon: "sprite:telegram-icon", label: "cart.trust.support" },
  { icon: "sprite:shield-half", label: "cart.trust.refund" },
] as const

const CartTrust = () => (
  <ul className="flex flex-col gap-1.5 text-xs text-neutral-400">
    {TRUST_POINTS.map(({ icon, label }) => (
      <li key={label} className="flex items-center gap-2">
        <Icon name={icon} className="size-3.5 shrink-0 text-green-400" />
        {translate[label]()}
      </li>
    ))}
  </ul>
)

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
