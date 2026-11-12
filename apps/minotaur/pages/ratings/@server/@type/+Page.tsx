import { Ratings } from "@/shared/components/app/ratings/components/rating-list";
import { isRatingType } from "@/shared/components/app/ratings/labels";
import { rating, ratings, ratingsState } from "@/shared/components/app/ratings/models/ratings.model";
import { createPageModel } from "@/shared/lib/events";
import { pageState } from "@/shared/models/page-context.model";
import { useAtom } from "@reatom/npm-react";

const page = createPageModel({
  name: "ratings-by-server",
  hooks: {
    onConnect: (ctx) => {
      const routeParams = ctx.get(pageState.routeParams)

      if (!isRatingType(routeParams.type) || !routeParams.server) return;

      ratingsState.filters.by(ctx, routeParams.type);
      ratingsState.filters.server(ctx, routeParams.server);

      rating.fetch(ctx);
      ratings.fetch(ctx)
    },
    onSpy: (ctx, _, routeParams) => {
      if (!isRatingType(routeParams.type) || !routeParams.server) return;

      const by = ctx.get(ratingsState.filters.by);
      const server = ctx.get(ratingsState.filters.server);

      // The page component stays mounted when only the route params change,
      // so the filter atoms have to be compared instead of relying on onConnect.
      if (by === routeParams.type && server === routeParams.server) return;

      ratingsState.filters.by(ctx, routeParams.type);
      ratingsState.filters.server(ctx, routeParams.server);
      ratingsState.filters.endCursor.reset(ctx);
      ratings.update.abort(ctx);

      ratings.fetch(ctx)
    },
    onDisconnect: (ctx) => {
      ratings.fetch.abort(ctx);
      ratings.update.abort(ctx);
    }
  },
  spyedAtom: pageState.routeParams
})

export default function Page() {
  const [_] = useAtom(page.dataAtom)

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <Ratings />
    </div>
  )
}
