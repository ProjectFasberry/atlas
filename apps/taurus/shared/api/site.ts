import { mainClient } from "./client"

/**
 * Editable landing content served by the API.
 *
 * The operations are not in the checked-in OpenAPI schema yet, so they are
 * described here. Regenerate the schema (`pnpm --filter @repo/shared openapi`)
 * after the API ships and this block can be deleted.
 */

export type SiteLocale = "ru" | "en"
export type SitePage = "home" | "servers" | "start" | "support" | "modpack"

export type SiteSection = { id: string; title: string; body: string; hidden: boolean }
export type BlockContent = { title?: string; description?: string; hidden?: boolean }
export type SectionsContent = { sections?: SiteSection[] }

export type SiteContentPayload = {
  page: string
  locale: SiteLocale
  content: unknown
  version: number
  updatedAt: string | null
}

/** Admin responses carry the draft and the published copy, not `content`. */
export type SiteAdminPayload = {
  page: string
  locale: SiteLocale
  draft: unknown
  published: unknown
  version: number
  updatedAt: string | null
  updatedBy: string | null
}

export type HomeContent = {
  carousel?: { image: string; alt?: string }[]
  sections?: SiteSection[]
  blocks?: Record<string, BlockContent>
}

export type ServerContentItem = {
  name?: string
  tagline?: string
  description?: string
  image?: string
  icon?: string
  features?: { icon: string; title: string; description: string }[]
}

export type ServersContent = {
  title?: string
  description?: string
  items?: Record<string, ServerContentItem>
  sections?: SiteSection[]
  blocks?: Record<string, BlockContent>
}

/** The API document is untyped JSON; keep a malformed value from crashing a page. */
export function asHomeContent(value: unknown): HomeContent | null {
  if (!isObject(value)) return null

  const carousel = value.carousel
  if (carousel === undefined) {
    return { sections: asSectionsContent(value), blocks: asBlocks(value) }
  }

  if (!Array.isArray(carousel)) return null

  const items = carousel.flatMap((item) => {
    if (!isObject(item) || typeof item.image !== "string" || !item.image) return []

    return [{
      image: item.image,
      alt: typeof item.alt === "string" ? item.alt : undefined,
    }]
  })

  return { carousel: items, sections: asSectionsContent(value), blocks: asBlocks(value) }
}

export function asServersContent(value: unknown): ServersContent | null {
  if (!isObject(value)) return null

  const title = stringOrUndefined(value.title)
  const description = stringOrUndefined(value.description)
  const items = value.items

  if (items === undefined) return { title, description }

  if (!isObject(items)) return null

  const result: Record<string, ServerContentItem> = {}

  for (const [key, item] of Object.entries(items)) {
    if (!isObject(item)) continue

    result[key] = {
      name: stringOrUndefined(item.name),
      tagline: stringOrUndefined(item.tagline),
      description: stringOrUndefined(item.description),
      image: stringOrUndefined(item.image),
      icon: stringOrUndefined(item.icon),
      features: asFeatures(item.features),
    }
  }

  return { title, description, items: result, sections: asSectionsContent(value), blocks: asBlocks(value) }
}

function asFeatures(value: unknown): ServerContentItem["features"] {
  if (!Array.isArray(value)) return undefined

  const features = value.flatMap((item) => {
    if (!isObject(item)) return []
    if (typeof item.icon !== "string" || !item.icon) return []
    if (typeof item.title !== "string" || !item.title) return []
    if (typeof item.description !== "string" || !item.description) return []

    return [{ icon: item.icon, title: item.title, description: item.description }]
  })

  // An explicitly empty list clears the defaults; garbage keeps them.
  if (features.length > 0) return features

  return value.length === 0 ? [] : undefined
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

type ContentHeaders = Record<string, string>

/** One request per page on the server render; the API caches the document. */
export async function fetchHomeContent(locale: SiteLocale, headers: ContentHeaders) {
  const result = await mainClient
    .GET("/site/content/{page}", {
      params: { path: { page: "home" }, query: { locale } },
      headers,
    })
    .catch((error) => {
      console.error("[content] home request failed", error)
      return null
    })

  return asHomeContent(result?.data?.data?.content)
}

export async function fetchServersContent(locale: SiteLocale, headers: ContentHeaders) {
  const result = await mainClient
    .GET("/site/content/{page}", {
      params: { path: { page: "servers" }, query: { locale } },
      headers,
    })
    .catch((error) => {
      console.error("[content] servers request failed", error)
      return null
    })

  return asServersContent(result?.data?.data?.content)
}

export type SiteAccess = { nickname: string | null; canEdit: boolean; canPublish: boolean }

/** Present on a page's data only when the visitor may edit it. */
export type SiteEditMeta = {
  active: true
  canPublish: boolean
  version: number
  updatedAt: string | null
  /** Resolved on the server, so the client does not re-init in another locale. */
  locale: SiteLocale
}

export async function fetchSiteAccess(headers: ContentHeaders): Promise<SiteAccess | null> {
  const result = await mainClient
    .GET("/site/access", { headers })
    .catch(() => null)

  return result?.data?.data ?? null
}

/** The editor's document: the draft when it exists, published otherwise. */
export async function fetchSiteDraft(page: SitePage, locale: SiteLocale, headers: ContentHeaders) {
  const result = await mainClient
    .GET("/site/content/{page}", {
      params: { path: { page }, query: { locale, draft: "1" } },
      headers,
    })
    .catch((error) => {
      console.error(`[content] ${page} draft request failed`, error)
      return null
    })

  return result?.data?.data ?? null
}

export function saveSiteDraft(page: SitePage, locale: SiteLocale, version: number, content: unknown) {
  return mainClient.PUT("/privated/content/{page}/{locale}", {
    params: { path: { page, locale } },
    body: { version, content },
  })
}

export function publishSiteDraft(page: SitePage, locale: SiteLocale, version: number) {
  return mainClient.POST("/privated/content/{page}/{locale}/publish", {
    params: { path: { page, locale } },
    body: { version },
  })
}

export function discardSiteDraft(page: SitePage, locale: SiteLocale, version: number) {
  return mainClient.POST("/privated/content/{page}/{locale}/discard", {
    params: { path: { page, locale } },
    body: { version },
  })
}

/** Parse the ordered custom sections shared by every page. */
export function asSectionsContent(value: unknown): SiteSection[] {
  const doc = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

  if (!Array.isArray(doc.sections)) return []

  return doc.sections.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return []

    const entry = item as Record<string, unknown>
    const title = typeof entry.title === "string" ? entry.title : ""
    if (!title) return []

    return [{
      id: typeof entry.id === "string" && entry.id ? entry.id : `s${Math.random().toString(36).slice(2, 8)}`,
      title,
      body: typeof entry.body === "string" ? entry.body : "",
      hidden: entry.hidden === true,
    }]
  })
}

/** Published content for any page, untyped JSON. */
export async function fetchPageContent(page: SitePage, locale: SiteLocale, headers: ContentHeaders) {
  const result = await mainClient
    .GET("/site/content/{page}", {
      params: { path: { page }, query: { locale } },
      headers,
    })
    .catch((error) => {
      console.error(`[content] ${page} request failed`, error)
      return null
    })

  return result?.data?.data?.content ?? null
}

/**
 * Published content for visitors; the draft and the edit metadata for editors.
 * Access is resolved from the forwarded cookie on the server.
 */
export async function resolvePageContent(
  page: SitePage,
  locale: SiteLocale,
  headers: ContentHeaders,
  wantsEdit: boolean,
): Promise<{ content: unknown; edit: SiteEditMeta | null; canEdit: boolean }> {
  // The access check runs for every render: it is what shows the "Edit page"
  // entry to staff without putting a token or a flag in the URL.
  const access = await fetchSiteAccess(headers)
  const canEdit = Boolean(access?.canEdit)

  if (wantsEdit && access?.canEdit) {
    const draft = await fetchSiteDraft(page, locale, headers)

    return {
      content: draft?.content ?? null,
      canEdit,
      edit: {
        active: true,
        canPublish: access.canPublish,
        version: draft?.version ?? 0,
        updatedAt: draft?.updatedAt ?? null,
        locale: draft?.locale ?? locale,
      },
    }
  }

  return { content: await fetchPageContent(page, locale, headers), edit: null, canEdit }
}

/** Overrides for the page's built-in sections. */
export function asBlocks(value: unknown): Record<string, BlockContent> {
  const doc = typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

  if (typeof doc.blocks !== "object" || doc.blocks === null || Array.isArray(doc.blocks)) return {}

  const result: Record<string, BlockContent> = {}

  for (const [id, item] of Object.entries(doc.blocks)) {
    if (typeof item !== "object" || item === null || Array.isArray(item)) continue

    const entry = item as Record<string, unknown>
    const block: BlockContent = {}
    if (typeof entry.title === "string") block.title = entry.title
    if (typeof entry.description === "string") block.description = entry.description
    if (entry.hidden === true) block.hidden = true

    if (Object.keys(block).length) result[id] = block
  }

  return result
}
