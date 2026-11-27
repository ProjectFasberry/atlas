import {
  withReset, atom, batch, reatomAsync, withAbort, action,
  withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom
} from "@reatom/framework";
import { logError } from "@/shared/lib/log";
import {
  type RatingData, type RatingMap, type RatingsPayload,
} from "../schema";
import { client } from "@/shared/lib/client-wrapper";
import { withSsr } from "@/shared/models/ssr";
import { createViewerModel } from "@/shared/models/shared.model";
import { type RatingType } from "../labels";
import { DEFAULT_RATINGS_PREFERENCES, isSamePreferences, syncPreferencesUrl } from "../preferences";
import { type RatingItem, type RatingsPreferences } from "../types";

export type { RatingItem } from "../types";

export const { Component: RatingsViewer, inViewAtom: ratingIsViewAtom } = createViewerModel({
  name: "ratings-list",
})

/** Fetched by the route data (SSR) and cached by the `rating` atom (client). */
export async function fetchRatingList(): Promise<RatingItem[]> {
  return client.raw
    .get<RatingItem[]>("/server/rating/list")
    .then((items) => items ?? [])
}

/** Groups (servers and their rating types) shown by the toolbar. Persisted in
 * the SSR snapshot, so the filters exist in the first HTML, not after fetch. */
export const ratingsGroups = atom<RatingItem[] | null>(null, "ratingsGroups").pipe(
  withReset(),
  withSsr("ratingsGroups"),
)

export const ratingsState = atom(null, "ratingsState").pipe(
  withAssign((_, name) => ({
    data: atom<RatingsPayload["data"] | null>(null, `${name}.data`).pipe(withReset(), withSsr(`${name}.data`)),
    meta: atom<RatingsPayload["meta"] | null>(null, `${name}.meta`).pipe(withReset(), withSsr(`${name}.meta`)),
    loaded: atom(false, `${name}.loaded`).pipe(withSsr(`${name}.loaded`)),
    filters: atom(null, `${name}.filters`).pipe(
      withAssign((_, name) => ({
        by: atom<RatingType>(DEFAULT_RATINGS_PREFERENCES.type, `${name}.by`).pipe(withSsr(`${name}.filters.by`)),
        server: atom<Maybe<string>>(undefined, `${name}.server`).pipe(withSsr(`${name}.filters.server`)),
        asc: atom(false, `${name}.asc`).pipe(withSsr(`${name}.filters.asc`)),
        endCursor: atom<Maybe<string>>(undefined, `${name}.endCursor`).pipe(withReset())
      }))
    )
  }))
)

export async function fetchRatings(
  by: keyof RatingMap,
  params: { asc: boolean; server?: string; endCursor?: string; limit?: number },
  init?: RequestInit,
) {
  return client.get("/server/rating/{by}", {
    ...init,
    retry: 1,
    params: {
      path: { by },
      query: { ...params, limit: params.limit ?? 50 },
    },
  })
}

export const ratings = atom(null, "ratings").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const cursor = ctx.get(ratingsState.filters.endCursor)
      const isAppend = Boolean(cursor)

      if (!isAppend) {
        // The previous category/sort must not flash under the new columns.
        ratingsState.data.reset(ctx);
        ratingsState.meta.reset(ctx);
        ratingsState.loaded(ctx, false);
      }

      return await ctx.schedule(() => fetchRatings(
        ctx.get(ratingsState.filters.by) as keyof RatingMap,
        {
          asc: ctx.get(ratingsState.filters.asc),
          server: ctx.get(ratingsState.filters.server),
          endCursor: cursor,
        },
        { signal: ctx.controller.signal },
      ))
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        const isAppend = Boolean(ctx.get(ratingsState.filters.endCursor));
        const fresh = res.data as RatingData;
        const previous = ctx.get(ratingsState.data) as RatingData | null;

        batch(ctx, () => {
          if (isAppend && previous) ratingsState.data(ctx, [...previous, ...fresh] as RatingData)
          else ratingsState.data(ctx, fresh.length === 0 ? null : fresh)

          ratingsState.meta(ctx, res.meta);
          ratingsState.loaded(ctx, true);
        });
      },
      onReject: (ctx, e) => {
        ratingsState.loaded(ctx, true);
        logError(e);
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withAbort()
    ),
    loadMore: action((ctx) => {
      if (ctx.get(ratings.fetch.statusesAtom).isPending) return;

      const meta = ctx.get(ratingsState.meta);
      if (!meta?.hasNextPage || !meta.endCursor) return;

      ratingsState.filters.endCursor(ctx, meta.endCursor);
      ratings.fetch(ctx);
    }, `${name}.loadMore`),
    applyFilters: action((ctx, next: Partial<RatingsPreferences>) => {
      const current: RatingsPreferences = {
        server: ctx.get(ratingsState.filters.server) ?? DEFAULT_RATINGS_PREFERENCES.server,
        type: ctx.get(ratingsState.filters.by),
        asc: ctx.get(ratingsState.filters.asc),
      };
      const merged: RatingsPreferences = { ...current, ...next };

      if (isSamePreferences(merged, current) && ctx.get(ratingsState.loaded)) return;

      ratings.fetch.abort(ctx);
      ratingsState.filters.server(ctx, merged.server);
      ratingsState.filters.by(ctx, merged.type);
      ratingsState.filters.asc(ctx, merged.asc);
      ratingsState.filters.endCursor.reset(ctx);

      syncPreferencesUrl(merged);
      ratings.fetch(ctx);
    }, `${name}.applyFilters`)
  }))
)

ratingIsViewAtom.onChange((ctx, state) => {
  if (!state) return;
  ratings.loadMore(ctx);
});

export const rating = atom(null, "rating").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const groups = await ctx.schedule(() => fetchRatingList())
      ratingsGroups(ctx, groups)
      return groups
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom()
    )
  }))
)
