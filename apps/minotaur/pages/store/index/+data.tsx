import { cart } from "@/shared/components/app/shop/models/store-cart.model";
import { storeItems } from "@/shared/components/app/shop/models/store.model";
import { env } from "@/shared/env";
import { isBotRequest } from "@/shared/lib/helpers";
import { logRouting } from "@/shared/lib/log";
import { getStaticImage } from "@/shared/lib/helpers";
import { wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContextServer } from "vike/types";
import { translate } from "@/shared/locales/helpers";

const image = getStaticImage("backgrounds/main_background.png")

function metadata() {
  const title = wrapTitle(translate["store.page.title"]());
  const description = translate["store.page.description"]();

  return {
    title,
    image,
    description,
    Head: (
      <>
        <meta name="robots" content="index, follow, noarchive" />
        <meta name="googlebot" content="index, follow, noimageindex, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${env.VITE_APP_URL}/store`} />
        <meta property="og:image" content={image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <meta property="twitter:image:type" content="image/jpeg" />
        <meta property="twitter:image:width" content="1200" />
        <meta property="twitter:image:height" content="630" />
      </>
    )
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data")

  const headers = pageCtx.headers ?? undefined;
  if (!headers) return;

  const config = useConfig()
  config(metadata())

  if (isBotRequest(headers, pageCtx.urlPathname)) {
    return;
  }

  await Promise.all([
    storeItems.init(pageCtx),
    cart.init(pageCtx)
  ])
}
