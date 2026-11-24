import { getUrl, wrapTitle } from "@/shared/lib/helpers"
import { useConfig } from "vike-solid/useConfig"
import type { PageContextServer } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { apiRequestHeaders } from "@/shared/api/server"
import {
  asServersContent, resolvePageContent,
  type ServersContent, type SiteLocale,
} from "@/shared/api/site"
import { getLocale } from "@/paraglide/runtime"

export type Data = {
  content: ServersContent | null
  locale: SiteLocale
  canEdit: boolean
  canPublish: boolean
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const locale = getLocale()
  const headers = apiRequestHeaders(pageCtx)
  const pageContent = await resolvePageContent("servers", locale, headers)
  const content = asServersContent(pageContent.content)

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

  return {
    content,
    locale,
    canEdit: pageContent.canEdit,
    canPublish: pageContent.canPublish,
  }
}
