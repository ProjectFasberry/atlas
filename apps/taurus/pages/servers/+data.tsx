import { getUrl, wrapTitle } from "@/shared/lib/helpers"
import { useConfig } from "vike-solid/useConfig"
import type { PageContextServer } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { apiRequestHeaders } from "@/shared/api/server"
import {
  asServersContent, resolvePageContent,
  type ServersContent, type SiteEditMeta,
} from "@/shared/api/site"
import { getLocale } from "@/paraglide/runtime"

export type Data = {
  content: ServersContent | null
  edit: SiteEditMeta | null
  canEdit: boolean
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const locale = getLocale()
  const headers = apiRequestHeaders(pageCtx)
  const wantsEdit = pageCtx.urlParsed.search.edit === "1"

  const pageContent = await resolvePageContent("servers", locale, headers, wantsEdit)
  const content = asServersContent(pageContent.content)
  const edit = pageContent.edit

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
        {edit && <meta name="robots" content="noindex, nofollow" />}
      </>
    ),
  })

  return { content, edit, canEdit: pageContent.canEdit }
}
