import { Ratings } from "@/shared/components/app/ratings/components/rating-list";
import { rating, ratings, ratingsState } from "@/shared/components/app/ratings/models/ratings.model";
import {
  DEFAULT_RATINGS_PREFERENCES, hasPreferencesQuery, isSamePreferences, normalizePreferencesUrl,
  writePreferencesCookie
} from "@/shared/components/app/ratings/preferences";
import { type RatingsPageData, type RatingsPreferences } from "@/shared/components/app/ratings/types";
import { createPageModel } from "@/shared/lib/events";
import { pageState } from "@/shared/models/page-context.model";
import { useAtom } from "@reatom/npm-react";

const page = createPageModel({
  name: "ratings",
  hooks: {
    onConnect: (ctx) => {
      const data = ctx.get(pageState.data) as RatingsPageData | null
      const filters = data?.ratingsFilters ?? DEFAULT_RATINGS_PREFERENCES

      const search = ctx.get(pageState.urlParsed)?.search ?? {}

      ratings.applyFilters(ctx, filters, { persist: false, force: true })
      normalizePreferencesUrl(filters, search)
      if (hasPreferencesQuery(search)) writePreferencesCookie(filters)
      rating.fetch(ctx)
    },
    onSpy: (ctx, _, data) => {
      const filters = (data as RatingsPageData | null)?.ratingsFilters
      if (!filters) return

      const current: RatingsPreferences = {
        server: ctx.get(ratingsState.filters.server) ?? DEFAULT_RATINGS_PREFERENCES.server,
        type: ctx.get(ratingsState.filters.by),
        asc: ctx.get(ratingsState.filters.asc),
      }

      const search = ctx.get(pageState.urlParsed)?.search ?? {}

      normalizePreferencesUrl(filters, search)
      if (hasPreferencesQuery(search)) writePreferencesCookie(filters)

      if (isSamePreferences(current, filters)) return

      ratings.applyFilters(ctx, filters, { persist: false })
    },
    onDisconnect: (ctx) => {
      ratings.fetch.abort(ctx)
      ratings.update.abort(ctx)
    }
  },
  spyedAtom: pageState.data
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <Ratings />
    </div>
  )
}
