import { getUrl, wrapTitle } from "@/shared/lib/helpers"
import { useConfig } from "vike-solid/useConfig"
import type { PageContext } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { mainClient } from "@/shared/api/client"
import { apiRequestHeaders } from "@/shared/api/server"

export type Data = Awaited<ReturnType<typeof data>>

export async function data(pageCtx: PageContext) {
  const config = useConfig()

  const headers = apiRequestHeaders(pageCtx);

  const title = wrapTitle(translate["pages.modpack.title"]())
  const description = translate["pages.modpack.description"]()

  const data = await mainClient.GET("/modpack/list", { headers })
    .then(r => r.data?.data ?? [])
    .catch(() => null)

  config({
    title,
    description,
    Head: (
      <>
        <link rel="canonical" href={getUrl(pageCtx)} />
        <meta property="og:url" content={getUrl(pageCtx)} />
        <meta property="og:title" content={title} />
        <meta property="og:site_name" content={title} />
        <meta name="twitter:title" content={title} />
      </>
    )
  })

  return {
    data: data ?? [],
    failed: data === null,
  }
}
