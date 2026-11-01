import { type PageContextServer } from "vike/types";
import { useConfig } from 'vike-react/useConfig'
import { getNotExistUrlByEntity, wrapTitle } from "@/shared/lib/helpers";
import { render } from "vike/abort";
import { cart } from "@/shared/components/app/shop/models/store-cart.model";
import { logRouting } from "@/shared/lib/log";
import { getStoreItem, type StoreItem, storeItemState } from "@/shared/components/app/shop/models/store-item.model";
import { createCtx } from "@reatom/framework";
import { snapshots } from "@/shared/models/ssr";

function metadata(
  item: StoreItem,
  pageCtx: PageContextServer
) {
  const title = wrapTitle(item.title).slice(0, 64)
  const description = item.description ?? "";
  const image = item.imageUrl
  const keywords = `${item.title}, fasberry, fasberry page, товар, магазин, store`

  return {
    title,
    description,
    image,
    Head: (
      <>
        <meta property="og:url" content={pageCtx.urlPathname} />
        <meta property="og:type" content="website" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <link rel="preload" as="image" href={image} imageSrcSet="" imageSizes="" />
        <meta name="keywords" content={keywords} />
      </>
    ),
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  const headers = pageCtx.headers ?? undefined

  const result = await getStoreItem(pageCtx.routeParams.id, { headers }).catch((e) => {
    console.error(e)
    return null;
  })

  if (!result) throw render(getNotExistUrlByEntity("store.item"))

  config(metadata(result, pageCtx))

  await cart.init(pageCtx)

  const ctx = createCtx()
  storeItemState.data(ctx, result)
  pageCtx.snapshot = snapshots.merge(ctx, pageCtx)
}
