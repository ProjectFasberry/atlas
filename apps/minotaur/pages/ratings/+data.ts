import { useConfig } from 'vike-react/useConfig'
import { wrapTitle } from "@/shared/lib/helpers"
import { getStaticImage } from '@/shared/lib/helpers'
import { type PageContextServer } from 'vike/types'
import { logRouting } from '@/shared/lib/log'
import { translate } from '@/shared/locales/helpers'
import { fetchRatingList } from "@/shared/components/app/ratings/models/ratings.model";
import { type RatingItem } from "@/shared/components/app/ratings/types";
import {
  parsePreferencesSearch, readPreferencesCookie, resolvePreferences
} from "@/shared/components/app/ratings/preferences";

const image = getStaticImage("arts/sand-camel.jpg")

function metadata() {
  const title = wrapTitle(translate["ratings.page.title"]())
  const description = translate["ratings.page.description"]()

  return {
    title,
    description,
    image,
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata())

  const search = parsePreferencesSearch(pageCtx.urlParsed.search)
  const cookie = readPreferencesCookie(pageCtx.headers)

  let groups: RatingItem[] = []
  try {
    groups = await fetchRatingList()
  } catch {
    // The page model shows its own error and retry state.
  }

  const ratingsFilters = resolvePreferences(search, cookie, groups)

  return { ratingsFilters }
}
