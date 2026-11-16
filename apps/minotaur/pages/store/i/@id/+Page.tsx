import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { navigate } from "vike/client/router"
import { toast } from "sonner"
import { tv } from "tailwind-variants"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"
import { Link } from "@/shared/components/config/link/link"
import { createLink } from "@/shared/components/config/link/link.model"
import {
  getItemStatus, relatedItems, storeItem, storeItemState,
  type StoreItem as StoreItemData,
} from "@/shared/components/app/shop/models/store-item.model"
import { selectedDonateDataAtom } from "@/shared/components/app/shop/models/store-item-description.model"
import { ItemPrice, ItemSelectToCart, StoreItem } from "@/shared/components/app/shop/components/items/store-item"
import { appState } from "@/shared/models/app/index.model"
import { translate } from "@/shared/locales/helpers"

const cardClass = "rounded-xl bg-neutral-900 p-4 sm:p-5"

const itemCategory = (item: StoreItemData): "donate" | "event" | "all" =>
  item.type === "donate" || item.type === "event" ? item.type : "all"

const itemTypeLabel = (item: StoreItemData) =>
  item.type === "donate"
    ? translate["store.filters.type.variants.donate"]()
    : item.type === "event"
      ? translate["store.filters.type.variants.event"]()
      : item.type

const Breadcrumbs = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)

  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400">
      <Link href="/store" className="duration-150 hover:text-neutral-100">
        {translate["store.item.breadcrumb"]()}
      </Link>
      <Icon name="sprite:chevron-right" className="size-4 text-neutral-600" />
      <span className="truncate text-neutral-200">{data?.title ?? "…"}</span>
    </div>
  )
}, "ItemBreadcrumbs")

const ItemGallery = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)

  if (!data) return <Skeleton className="aspect-square w-full rounded-xl lg:aspect-[4/5]" />

  return (
    <div className={`${cardClass} relative flex items-center justify-center overflow-hidden p-2 sm:p-6`}>
      <img
        src={data.imageUrl}
        alt={data.title}
        loading="eager"
        className="aspect-square w-full max-w-lg select-none object-contain"
      />
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
          {itemTypeLabel(data)}
        </span>
        <span className="rounded-md bg-black/60 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
          {data.currency}
        </span>
      </div>
    </div>
  )
}, "ItemGallery")

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

    void navigator.clipboard.writeText(`${window.location.origin}${createLink("store", data.id)}`)
      .then(() => toast.success(translate["store.item.link-copied"]()))
      .catch(() => toast.error(translate["store.item.link-copy-error"]()))
  }

  return (
    <Button background="default" className="h-9 w-fit gap-2 text-xs font-semibold" onClick={share}>
      <Icon name="sprite:link" className="size-4" />
      {translate["store.item.share"]()}
    </Button>
  )
}, "ItemShare")

const ItemPurchase = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) {
    return <Skeleton className="h-48 w-full rounded-xl" />
  }

  const selected = ctx.spy(getItemStatus(data.id))?.isSelected ?? false

  const buyNow = () => {
    if (!selected) storeItem.add(ctx, data.id)
    void navigate("/store/cart")
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-neutral-900 p-4 sm:p-5 lg:sticky lg:top-24">
      <div className="flex flex-col gap-1">
        <Typography className="text-2xl font-semibold leading-tight">{data.title}</Typography>
        {data.description && (
          <Typography color="gray" className="text-sm">{data.description}</Typography>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <ItemPrice currency={data.currency} price={{ value: data.price, variant: { size: "large" } }} />
        <span className="text-xs text-neutral-500">{translate["store.item.vat-included"]()}</span>
      </div>

      <div className="flex flex-col gap-2">
        <Button background="white" className="h-10 w-full font-semibold" onClick={buyNow}>
          {selected ? translate["store.item.checkout"]() : translate["store.item.buy-now"]()}
        </Button>
        <ItemSelectToCart id={data.id} />
      </div>

      <ItemFeatures />
      <ItemShare />
    </div>
  )
}, "ItemPurchase")

const ItemDescription = reatomComponent(({ ctx }) => {
  const html = ctx.spy(selectedDonateDataAtom)
  const isMobile = ctx.spy(appState.current.isMobile)
  const isExpanded = ctx.spy(storeItemState.isExpanded)

  return (
    <section className={`${cardClass} flex flex-col gap-3`}>
      <Typography className="text-lg font-semibold">{translate["store.item.about"]()}</Typography>
      {html ? (
        <div
          className="relative w-full overflow-hidden rounded-xl"
          onClick={() => {
            if (!isMobile) return
            storeItemState.isExpanded(ctx, (state) => !state)
          }}
          style={{ cursor: isMobile ? "pointer" : "default" }}
        >
          <div
            className="tiptap whitespace-pre-wrap p-0! duration-150"
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {!isExpanded && (
            <>
              <div className="absolute inset-x-0 bottom-0 z-2 h-full bg-linear-to-t from-neutral-900 via-neutral-900/90 to-neutral-900/40" />
              <div className="absolute inset-x-0 bottom-4 z-3 flex items-center justify-center">
                <Icon name="sprite:chevron-down" className="size-6 text-neutral-400" />
              </div>
            </>
          )}
        </div>
      ) : (
        <Skeleton className="h-40 w-full" />
      )}
    </section>
  )
}, "ItemDescription")

const RelatedItems = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)

  useUpdate((ctx) => {
    if (!data) return
    relatedItems.fetch(ctx, {
      category: itemCategory(data),
      wallet: data.currency,
      excludeId: data.id,
    })
  }, [data?.id])

  const items = ctx.spy(relatedItems.fetch.dataAtom)
  if (!items?.length) return null

  return (
    <section className="flex flex-col gap-3">
      <Typography className="text-lg font-semibold">{translate["store.item.related"]()}</Typography>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => <StoreItem key={item.id} {...item} />)}
      </div>
    </section>
  )
}, "RelatedItems")

const MobilePurchaseBar = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null

  const selected = ctx.spy(getItemStatus(data.id))?.isSelected ?? false

  const buyNow = () => {
    if (!selected) storeItem.add(ctx, data.id)
    void navigate("/store/cart")
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-800 bg-neutral-950/95 px-4 pb-[env(safe-area-inset-bottom)] pt-3 backdrop-blur lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <ItemPrice currency={data.currency} price={{ value: data.price, variant: { size: "large" } }} />
        <Button background="white" className="h-10 min-w-40 font-semibold" onClick={buyNow}>
          {selected ? translate["store.item.checkout"]() : translate["store.item.buy-now"]()}
        </Button>
      </div>
    </div>
  )
}, "MobilePurchaseBar")

export default function Page() {
  return (
    <div className="flex w-full flex-col gap-6 pb-24 lg:pb-0">
      <Breadcrumbs />
      <div className="grid w-full items-start gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <ItemGallery />
        </div>
        <div className="lg:col-span-5">
          <ItemPurchase />
        </div>
      </div>
      <ItemDescription />
      <RelatedItems />
      <MobilePurchaseBar />
    </div>
  )
}
