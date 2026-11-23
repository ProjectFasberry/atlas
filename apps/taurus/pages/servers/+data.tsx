import { getUrl, wrapTitle } from "@/shared/lib/helpers"
import { useConfig } from "vike-solid/useConfig"
import type { PageContext } from "vike/types"
import { translate } from "@/shared/locales/helpers"

export async function data(pageCtx: PageContext) {
  const config = useConfig()

  const title = wrapTitle(translate["servers.page.title"]())
  const description = translate["servers.page.description"]()

  config({
    title,
    description,
    Head: (
      <>
        <link rel="canonical" href={getUrl(pageCtx)} />
        <meta property="og:url" content={getUrl(pageCtx)} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:site_name" content={title} />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
      </>
    ),
  })
}
