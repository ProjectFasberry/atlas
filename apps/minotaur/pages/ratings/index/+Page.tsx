import { Ratings } from "@/shared/components/app/ratings/components/rating-list";
import { rating, ratings } from "@/shared/components/app/ratings/models/ratings.model";
import { DEFAULT_RATINGS_PREFERENCES } from "@/shared/components/app/ratings/preferences";
import { type RatingsPageData } from "@/shared/components/app/ratings/types";
import { createPageModel } from "@/shared/lib/events";
import { pageState } from "@/shared/models/page-context.model";
import { useAtom } from "@reatom/npm-react";

const page = createPageModel({
  name: "ratings",
  hooks: {
    onConnect: (ctx) => {
      const data = ctx.get(pageState.data) as RatingsPageData | null
      const filters = data?.ratingsFilters ?? DEFAULT_RATINGS_PREFERENCES

      ratings.applyFilters(ctx, filters)
      rating.fetch(ctx)
    },
    onSpy: (ctx, _, data) => {
      const filters = (data as RatingsPageData | null)?.ratingsFilters
      if (!filters) return

      ratings.applyFilters(ctx, filters)
    },
    onDisconnect: (ctx) => {
      ratings.fetch.abort(ctx)
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
