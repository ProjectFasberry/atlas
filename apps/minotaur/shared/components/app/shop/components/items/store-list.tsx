import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { reatomComponent } from "@reatom/npm-react"
import { storeItems, storeItemsState } from "../../models/store.model"
import { getStaticImage } from "@/shared/lib/helpers"
import { PageLoader } from "@/shared/ui/page-loader"
import { StoreItem, StoreItemRow } from "./store-item"
import { appearanceState } from "../../../settings/models/settings-appearance.model"
import { pageState } from "@/shared/models/page-context.model"
import { isEmptyArray } from "@/shared/lib/utils"
import { translate } from "@/shared/locales/helpers"

const itemsNotFoundImage = getStaticImage("minecraft/items/block_inspect.webp")

const ItemsNotFound = () => {
  return (
    <div className="flex flex-col gap-2 items-center h-full justify-center w-full">
      <img src={itemsNotFoundImage} width={64} height={64} alt="" />
      <Typography className="text-xl font-semibold">{translate["store.list.empty"]()}</Typography>
    </div>
  )
}

export const StoreList = reatomComponent(({ ctx }) => {
  if (ctx.spy(storeItems.fetch.statusesAtom).isPending) {
    return <PageLoader />
  }

  const data = ctx.spy(storeItemsState.data)
  if (!data || isEmptyArray(data)) return <ItemsNotFound />;

  const meta = ctx.spy(storeItemsState.meta)
  const isLoadingMore = ctx.spy(storeItems.loadMore.statusesAtom).isPending
  const footer = meta?.hasNextPage ? (
    <div className="flex w-full justify-center">
      <Button
        background="default"
        className="h-9 px-4 text-sm"
        disabled={isLoadingMore}
        onClick={() => storeItems.loadMore(ctx)}
      >
        {translate["store.list.load-more"]()}
      </Button>
    </div>
  ) : null

  const isList = ctx.spy(pageState.isClientside) && ctx.spy(appearanceState.storeView) === "list"

  if (isList) {
    return (
      <>
        <div className="flex flex-col gap-2 w-full h-full">
          {data.map(item => <StoreItemRow key={item.id} {...item} />)}
        </div>
        {footer}
      </>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-auto gap-2 lg:gap-4 w-full h-full">
        {data.map(item => <StoreItem key={item.id} {...item} />)}
      </div>
      {footer}
    </>
  )
}, "StoreList")
