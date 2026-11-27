import { reatomComponent } from "@reatom/npm-react"
import { navigate } from "vike/client/router"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { createLink } from "@/shared/components/config/link/link.model"
import { storeItemState } from "../../models/store-item.model"
import { cart, cartContainsItemAtom } from "../../models/store-cart.model"
import { ItemPrice, ItemSelectToCart } from "../items/store-item"
import { translate } from "@/shared/locales/helpers"

const FEATURES = [
  { icon: "sprite:check", label: "store.item.features.instant" },
  { icon: "sprite:credit-card-pay", label: "store.item.features.payment" },
  { icon: "sprite:shield-half", label: "store.item.features.refund" },
] as const

const ItemFeatures = () => (
  <ul className="flex flex-col gap-2 text-sm text-neutral-400">
    {FEATURES.map(({ icon, label }) => (
      <li key={label} className="flex items-center gap-2">
        <Icon name={icon} className="size-4 shrink-0 text-green-400" />
        {translate[label]()}
      </li>
    ))}
  </ul>
)

const ItemShare = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null

  const share = () => {
    if (typeof navigator === "undefined") return

    navigator.clipboard.writeText(`${window.location.origin}${createLink("store", data.id)}`)
      .then(() => toast.success(translate["store.item.link-copied"]()))
      .catch(() => toast.error(translate["store.item.link-copy-error"]()))
  }

  return (
    <Button
      background="default"
      className="h-9 w-fit gap-2 text-xs font-semibold"
      onClick={share}
    >
      <Icon name="sprite:link" className="size-4" />
      {translate["store.item.share"]()}
    </Button>
  )
}, "ItemShare")

/** Pay now: adds the product when it is missing and opens the cart. */
const ItemBuyNow = reatomComponent<{ className: string }>(({ ctx, className }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null

  const inCart = ctx.spy(cartContainsItemAtom(data.id))

  const buyNow = () => {
    if (!inCart) cart.addItem(ctx, data.id)
    void navigate("/store/cart")
  }

  return (
    <Button background="white" className={className} onClick={buyNow}>
      {inCart ? translate["store.item.checkout"]() : translate["store.item.buy-now"]()}
    </Button>
  )
}, "ItemBuyNow")

export const ItemPurchase = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)

  if (!data) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-4
      sm:p-5 lg:sticky lg:top-24">
      <div className="flex flex-col gap-1">
        <Typography className="text-2xl font-semibold leading-tight">
          {data.title}
        </Typography>
        {data.description && (
          <Typography color="gray" className="text-sm">
            {data.description}
          </Typography>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <ItemPrice
          currency={data.currency}
          price={{ value: data.price, variant: { size: "large" } }}
        />
        <span className="text-xs text-neutral-500">
          {translate["store.item.vat-included"]()}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <ItemBuyNow className="h-10 w-full font-semibold" />
        <ItemSelectToCart id={data.id} />
      </div>
      <ItemFeatures />
      <ItemShare />
    </div>
  )
}, "ItemPurchase")

export const MobilePurchaseBar = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t
      border-neutral-800 bg-neutral-950/95 px-4
      pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <ItemPrice
          currency={data.currency}
          price={{ value: data.price, variant: { size: "large" } }}
        />
        <ItemBuyNow className="h-10 min-w-40 font-semibold" />
      </div>
    </div>
  )
}, "MobilePurchaseBar")
