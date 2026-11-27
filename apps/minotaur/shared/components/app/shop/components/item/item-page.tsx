import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Icon } from "@/shared/ui/icon"
import { Skeleton } from "@/shared/ui/skeleton"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/config/link/link"
import {
  relatedItems, storeItemState, type StoreItem as StoreItemData,
} from "../../models/store-item.model"
import { selectedDonateDataAtom } from "../../models/store-item-description.model"
import { StoreItem } from "../items/store-item"
import { appState } from "@/shared/models/app/index.model"
import { WalletStrip } from "@/shared/components/app/wallet/components/wallet-strip"
import { ItemPurchase, MobilePurchaseBar } from "./item-purchase"
import { translate } from "@/shared/locales/helpers"
import { storeCurrencyLabel, storeItemTypeLabel } from "../../lib/labels"

const cardClass = "rounded-xl bg-neutral-900 p-4 sm:p-5"

const itemCategory = (item: StoreItemData): "donate" | "event" | "all" =>
  item.type === "donate" || item.type === "event" ? item.type : "all"

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
  if (!data) {
    return <Skeleton className="aspect-square w-full rounded-xl lg:aspect-4/5" />
  }

  return (
    <div className={`${cardClass} relative flex items-center
      justify-center overflow-hidden p-2 sm:p-6`}>
      <img
        src={data.imageUrl}
        alt={data.title}
        loading="eager"
        className="aspect-square w-full max-w-lg select-none object-contain"
      />
      <div className="absolute left-4 top-4 flex items-center gap-2">
        <span className="rounded-md bg-black/60
          px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
          {storeItemTypeLabel(data.type)}
        </span>
        <span className="rounded-md bg-black/60
          px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-200">
          {storeCurrencyLabel(data.currency)}
        </span>
      </div>
    </div>
  )
}, "ItemGallery")

const ItemDescription = reatomComponent(({ ctx }) => {
  const item = ctx.spy(storeItemState.data)
  const html = ctx.spy(selectedDonateDataAtom)
  const isMobile = ctx.spy(appState.current.isMobile)
  const isExpanded = ctx.spy(storeItemState.isExpanded)

  const hasHtml = Boolean(html?.trim())
  const text = item?.description?.trim()

  if (!hasHtml && !text) return null

  return (
    <section className={`${cardClass} flex flex-col gap-3`}>
      <Typography className="text-lg font-semibold">
        {translate["store.item.about"]()}
      </Typography>
      {hasHtml ? (
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
            dangerouslySetInnerHTML={{ __html: html! }}
          />
          {!isExpanded && (
            <>
              <div className="absolute inset-x-0 bottom-0 z-2 h-full
              bg-linear-to-t from-neutral-900 via-neutral-900/90 to-neutral-900/40" />
              <div className="absolute inset-x-0 bottom-4 z-3 flex items-center justify-center">
                <Icon name="sprite:chevron-down" className="size-6 text-neutral-400" />
              </div>
            </>
          )}
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-6 text-neutral-300 sm:text-base">
          {text}
        </p>
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
      <Typography className="text-lg font-semibold">
        {translate["store.item.related"]()}
      </Typography>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => <StoreItem key={item.id} {...item} />)}
      </div>
    </section>
  )
}, "RelatedItems")

export const StoreItemPage = () => (
  <div className="flex w-full flex-col gap-6 pb-24 lg:pb-0">
    <Breadcrumbs />
    <WalletStrip />
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
