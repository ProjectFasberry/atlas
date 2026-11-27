import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { Skeleton } from "@/shared/ui/skeleton"
import { ErrorBlock } from "@/shared/ui/error-block"
import { reatomComponent } from "@reatom/npm-react"
import { storeFiltersAtom, storeItems, storeItemsState } from "../../models/store.model"
import { StoreItem, StoreItemRow } from "./store-item"
import { appearanceState } from "../../../settings/models/settings-appearance.model"
import { pageState } from "@/shared/models/page-context.model"
import { isEmptyArray } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"
import { getStaticImage } from "@/shared/lib/helpers"

const itemsNotFoundImage = getStaticImage("minecraft/items/block_inspect.webp")

const StoreListSkeleton = () => (
  <div className="grid grid-cols-2 auto-rows-auto gap-2 lg:grid-cols-3 lg:gap-4 2xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, idx) => (
      <Skeleton key={idx} className="h-64 w-full rounded-xl" />
    ))}
  </div>
)

const ItemsNotFound = reatomComponent(({ ctx }) => {
  const filters = ctx.spy(storeFiltersAtom)
  const hasFilters = filters.category !== "all"
    || filters.wallet !== "ALL"
    || filters.searchQuery.trim().length > 0

  return (
    <div className="flex h-full min-h-64 w-full flex-col items-center justify-center gap-2 text-center">
      <img src={itemsNotFoundImage} width={64} height={64} alt="" />
      <Typography className="text-xl font-semibold">{translate["store.list.empty"]()}</Typography>
      <Typography color="gray" className="max-w-sm text-sm">
        {hasFilters
          ? translate["store.list.empty-filters"]()
          : translate["store.list.empty-hint"]()
        }
      </Typography>
      {hasFilters && (
        <Button
          background="default"
          className="mt-1 h-9 px-4 text-sm"
          onClick={() => storeItems.resetFilters(ctx)}
        >
          {translate["store.list.reset"]()}
        </Button>
      )}
    </div>
  )
}, "ItemsNotFound")

const StoreError = reatomComponent(({ ctx }) => (
  <div className="flex flex-col items-start gap-2">
    <ErrorBlock title={translate["store.list.error"]()} />
    <Button
      background="default"
      className="h-9 px-4 text-sm"
      onClick={() => storeItems.fetch(ctx)}
    >
      {translate["store.list.retry"]()}
    </Button>
  </div>
), "StoreError")

export const StoreList = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemsState.data)
  const meta = ctx.spy(storeItemsState.meta)
  const error = ctx.spy(storeItems.fetch.errorAtom)
  const loading = ctx.spy(storeItems.fetch.statusesAtom).isPending
  const isLoadingMore = ctx.spy(storeItems.loadMore.statusesAtom).isPending

  if (loading && !data) return <StoreListSkeleton />
  if (error && !data) return <StoreError />
  if (!data) return null

  if (!loading && isEmptyArray(data)) return <ItemsNotFound />

  const footer = meta?.hasNextPage ? (
    <div className="flex w-full justify-center">
      <Button
        background="default"
        className="h-9 px-4 text-sm"
        disabled={isLoadingMore || loading}
        onClick={() => storeItems.loadMore(ctx)}
      >
        {translate["store.list.load-more"]()}
      </Button>
    </div>
  ) : null

  const isList = ctx.spy(pageState.isClientside) && ctx.spy(appearanceState.storeView) === "list"

  return (
    <div
      className="flex w-full flex-col gap-4 duration-150
        data-[state=loading]:pointer-events-none data-[state=loading]:opacity-60"
      aria-busy={loading}
      data-state={loading ? "loading" : "idle"}
    >
      {isList ? (
        <div className="flex flex-col gap-2">
          {data.map(item => <StoreItemRow key={item.id} {...item} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 auto-rows-auto gap-2 lg:grid-cols-3 lg:gap-4 2xl:grid-cols-4">
          {data.map(item => <StoreItem key={item.id} {...item} />)}
        </div>
      )}
      {!loading && footer}
    </div>
  )
}, "StoreList")
