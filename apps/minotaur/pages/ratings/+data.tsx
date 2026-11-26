import { useConfig } from 'vike-react/useConfig'
import { wrapTitle } from "@/shared/lib/helpers"
import { getStaticImage } from '@/shared/lib/helpers'
import { type PageContextServer } from 'vike/types'
import { logRouting } from '@/shared/lib/log'
import { translate } from '@/shared/locales/helpers'
import { env } from "@/shared/env"
import { createCtx } from "@reatom/framework"
import { snapshots } from "@/shared/models/ssr"
import { fetchRatingList, fetchRatings, ratingsState } from "@/shared/components/app/ratings/models/ratings.model"
import { type RatingItem } from "@/shared/components/app/ratings/types"
import { getRatingTypeLabel, getServerLabel } from "@/shared/components/app/ratings/labels"
import { parsePreferencesSearch, resolvePreferences } from "@/shared/components/app/ratings/preferences"
import { type RatingData } from "@/shared/components/app/ratings/schema"

const image = getStaticImage("arts/sand-camel.jpg")

function metadata(
  typeLabel: string,
  serverLabel: string,
  canonical: string,
  list: unknown[],
) {
  const title = wrapTitle(translate["ratings.meta.title"]({ type: typeLabel, server: serverLabel }))
  const description = translate["ratings.meta.description"]({ type: typeLabel, server: serverLabel })

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    numberOfItems: list.length,
    itemListElement: list.slice(0, 10).map((row, index) => {
      const value = row as { nickname?: string, name?: string, ulid?: string }
      const name = value.nickname ?? value.name ?? `#${index + 1}`
      const path = value.nickname ? `/player/${value.nickname}` : value.ulid ? `/lands/${value.ulid}` : null

      return {
        "@type": "ListItem",
        position: index + 1,
        name,
        ...(path ? { url: `${env.VITE_APP_URL}${path}` } : {}),
      }
    }),
  }

  return {
    title,
    description,
    image,
    Head: (
      <>
        <link rel="canonical" href={canonical} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={image} />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </>
    ),
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  const search = parsePreferencesSearch(pageCtx.urlParsed.search)

  let groups: RatingItem[] = []
  try {
    groups = await fetchRatingList()
  } catch {
    // The page model shows its own error and retry state.
  }

  const ratingsFilters = resolvePreferences(search, groups)
  const typeLabel = getRatingTypeLabel(ratingsFilters.type)
  const serverLabel = getServerLabel(ratingsFilters.server)

  const canonical = new URL("/ratings", env.VITE_APP_URL)
  canonical.searchParams.set("server", ratingsFilters.server)
  canonical.searchParams.set("type", ratingsFilters.type)

  let rows: RatingData | null = null

  try {
    const page = await fetchRatings(
      ratingsFilters.type,
      { asc: ratingsFilters.asc, server: ratingsFilters.server, limit: 50 },
      { headers: pageCtx.headers ?? undefined },
    )

    rows = page.data.length === 0 ? null : page.data as RatingData

    const ctx = createCtx()
    ratingsState.data(ctx, rows)
    ratingsState.meta(ctx, page.meta)
    ratingsState.filters.server(ctx, ratingsFilters.server)
    ratingsState.filters.by(ctx, ratingsFilters.type)
    ratingsState.filters.asc(ctx, ratingsFilters.asc)
    ratingsState.loaded(ctx, true)
    pageCtx.snapshot = snapshots.merge(ctx, pageCtx)
  } catch {
    // Search engines still get the metadata and the static copy.
  }

  config(metadata(typeLabel, serverLabel, canonical.toString(), rows ?? []))

  return { ratingsFilters }
}
