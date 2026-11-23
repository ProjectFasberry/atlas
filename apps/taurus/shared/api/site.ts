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
export type SectionsContent = { sections?: SiteSection[] }

export type SiteContentPayload = {
  page: string
  locale: SiteLocale
  content: unknown
  version: number
  updatedAt: string | null
}

export type HomeContent = {
  carousel?: { image: string; alt?: string }[]
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
}

declare module "@repo/shared/types/gen/main/schema" {
  interface paths {
    "/site/content/{page}": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get: operations["getSiteContent"]
      put?: never
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    "/site/content": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get: operations["getSiteContentBatch"]
      put?: never
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    "/site/access": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get: operations["getSiteAccess"]
      put?: never
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    "/privated/content/{page}/{locale}": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get?: never
      put: operations["putPrivatedContentByPageByLocale"]
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    "/privated/content/{page}/{locale}/publish": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get?: never
      put?: never
      post: operations["postPrivatedContentByPageByLocalePublish"]
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
    "/privated/content/{page}/{locale}/discard": {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      get?: never
      put?: never
      post: operations["postPrivatedContentByPageByLocaleDiscard"]
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
  }

  interface operations {
    getSiteContent: {
      parameters: {
        query?: { locale?: SiteLocale; draft?: string }
        header?: never
        path: { page: string }
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: { "application/json": { data: SiteContentPayload } }
        }
        404: {
          headers: { [name: string]: unknown }
          content: { "application/json": { error: string } }
        }
      }
    }
    getSiteAccess: {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: {
            "application/json": {
              data: { nickname: string | null; canEdit: boolean; canPublish: boolean }
            }
          }
        }
      }
    }
    putPrivatedContentByPageByLocale: {
      parameters: {
        query?: never
        header?: never
        path: { page: string; locale: SiteLocale }
        cookie?: never
      }
      requestBody: {
        content: { "application/json": { version: number; content: unknown } }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: { "application/json": { data: SiteContentPayload } }
        }
      }
    }
    postPrivatedContentByPageByLocalePublish: {
      parameters: {
        query?: never
        header?: never
        path: { page: string; locale: SiteLocale }
        cookie?: never
      }
      requestBody: {
        content: { "application/json": { version: number } }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: { "application/json": { data: SiteContentPayload } }
        }
      }
    }
    postPrivatedContentByPageByLocaleDiscard: {
      parameters: {
        query?: never
        header?: never
        path: { page: string; locale: SiteLocale }
        cookie?: never
      }
      requestBody: {
        content: { "application/json": { version: number } }
      }
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: { "application/json": { data: SiteContentPayload } }
        }
      }
    }
    getSiteContentBatch: {
      parameters: {
        query?: { locale?: SiteLocale; pages?: string }
        header?: never
        path?: never
        cookie?: never
      }
      requestBody?: never
      responses: {
        200: {
          headers: { [name: string]: unknown }
          content: { "application/json": { data: Record<string, SiteContentPayload> } }
        }
      }
    }
  }
}

/** The API document is untyped JSON; keep a malformed value from crashing a page. */
export function asHomeContent(value: unknown): HomeContent | null {
  if (!isObject(value)) return null

  const carousel = value.carousel
  if (carousel === undefined) return {}

  if (!Array.isArray(carousel)) return null

  const items = carousel.flatMap((item) => {
    if (!isObject(item) || typeof item.image !== "string" || !item.image) return []

    return [{
      image: item.image,
      alt: typeof item.alt === "string" ? item.alt : undefined,
    }]
  })

  return { carousel: items }
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

  return { title, description, items: result }
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
): Promise<{ content: unknown; edit: SiteEditMeta | null }> {
  if (wantsEdit) {
    const access = await fetchSiteAccess(headers)

    if (access?.canEdit) {
      const draft = await fetchSiteDraft(page, locale, headers)

      return {
        content: draft?.content ?? null,
        edit: {
          active: true,
          canPublish: access.canPublish,
          version: draft?.version ?? 0,
          updatedAt: draft?.updatedAt ?? null,
          locale: draft?.locale ?? locale,
        },
      }
    }
  }

  return { content: await fetchPageContent(page, locale, headers), edit: null }
}
