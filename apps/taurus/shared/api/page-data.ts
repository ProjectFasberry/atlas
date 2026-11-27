import { getLocale } from "@/paraglide/runtime"
import { apiRequestHeaders } from "./server"
import { resolvePageContent, type SiteLocale, type SitePage } from "./site"

export type EditablePageData = {
  content: unknown
  locale: SiteLocale
  canEdit: boolean
  canPublish: boolean
}

type RequestLike = { headers?: Record<string, string> | null }

/**
 * The published document plus the visitor's edit permissions, shared by the
 * landing pages. Parsing stays with the page that knows its document shape.
 */
export async function loadPageData(page: SitePage, request: RequestLike): Promise<EditablePageData> {
  const locale = getLocale()
  const { content, canEdit, canPublish } = await resolvePageContent(
    page,
    locale,
    apiRequestHeaders(request),
  )

  return { content, locale, canEdit, canPublish }
}
