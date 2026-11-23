import { getUrl, wrapTitle } from "@/shared/lib/helpers"
import { useConfig } from "vike-solid/useConfig"
import type { PageContextServer } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { apiRequestHeaders } from "@/shared/api/server"
import {
  asServersContent, fetchServersContent, fetchSiteAccess, fetchSiteDraft,
  type ServersContent, type SiteEditMeta,
} from "@/shared/api/site"
import { getLocale } from "@/paraglide/runtime"

export type Data = {
  content: ServersContent | null
  edit: SiteEditMeta | null
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const locale = getLocale()
  const headers = apiRequestHeaders(pageCtx)
  const wantsEdit = pageCtx.urlParsed.search.edit === "1"

  let content: ServersContent | null = null
  let edit: SiteEditMeta | null = null

  if (wantsEdit) {
    const access = await fetchSiteAccess(headers)

    if (access?.canEdit) {
      const draft = await fetchSiteDraft("servers", locale, headers)

      content = asServersContent(draft?.content ?? null)
      edit = {
        active: true,
        canPublish: access.canPublish,
        version: draft?.version ?? 0,
        updatedAt: draft?.updatedAt ?? null,
        locale: draft?.locale ?? locale,
      }
    }
  }

  if (!edit) content = await fetchServersContent(locale, headers)

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

  return { content, edit }
}
