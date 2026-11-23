import { client } from "@/shared/lib/client-wrapper"

/**
 * Editable site content: the panel-side contract.
 *
 * The routes are already live in the API but the checked-in OpenAPI schema has
 * not been regenerated yet, so they are described here. Delete this block after
 * `pnpm --filter minotaur openapi` (or the next schema sync) and import the
 * types from the generated schema as usual.
 */

export type SitePageId = "home" | "servers" | "start" | "support" | "modpack"
export type SiteLocale = "ru" | "en"

export type SiteAdminPayload = {
  page: string
  locale: SiteLocale
  draft: unknown
  published: unknown
  version: number
  updatedAt: string | null
  updatedBy: string | null
}

export type SiteWriteBody = {
  version: number
  content: unknown
}

export type SiteSection = {
  id: string
  title: string
  body: string
  hidden?: boolean
}

export function getSiteContentAdmin(page: SitePageId, locale: SiteLocale) {
  return client.get("/privated/content/{page}", {
    params: { path: { page }, query: { locale } },
  })
}

export function saveSiteContentDraft(page: SitePageId, locale: SiteLocale, body: SiteWriteBody) {
  return client.put("/privated/content/{page}/{locale}", {
    params: { path: { page, locale } },
    json: body,
  })
}

export function publishSiteContent(page: SitePageId, locale: SiteLocale, version: number) {
  return client.post("/privated/content/{page}/{locale}/publish", {
    params: { path: { page, locale } },
    json: { version },
  })
}

export function discardSiteContentDraft(page: SitePageId, locale: SiteLocale, version: number) {
  return client.post("/privated/content/{page}/{locale}/discard", {
    params: { path: { page, locale } },
    json: { version },
  })
}
