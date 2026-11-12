import {
  withReset, atom, batch, type Ctx, reatomAsync, withAbort, action,
  withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom
} from "@reatom/framework";
import { withHistory } from "@/shared/lib/reatom/helpers";
import { logError } from "@/shared/lib/log";
import {
  type RatingBelkoin,
  type RatingCharism,
  type RatingData,
  type RatingLands,
  type RatingParkour,
  type RatingPlaytime,
  type RatingReputation,
  type RatingsPayload,
} from "@/shared/schemas/rating";
import { client } from "@/shared/lib/client-wrapper";
import { createViewerModel } from "@/shared/models/shared.model";
import { type RatingType } from "../labels";
import {
  DEFAULT_RATINGS_PREFERENCES, isSamePreferences, syncPreferencesUrl, writePreferencesCookie
} from "../preferences";
import { type RatingItem, type RatingsPreferences } from "../types";

export type { RatingItem } from "../types";

type RatingMap = {
  playtime: RatingPlaytime[];
  lands: RatingLands[];
  reputation: RatingReputation[];
  charism: RatingCharism[];
  belkoin: RatingBelkoin[];
  parkour: RatingParkour[];
};

export const { Component: RatingsViewer, inViewAtom: ratingIsViewAtom } = createViewerModel({
  name: "ratings-list",
})

let ratingListPromise: Promise<RatingItem[]> | null = null;

/** Shared by the route guard and the category pills. */
export function fetchRatingList(): Promise<RatingItem[]> {
  if (!ratingListPromise) {
    ratingListPromise = client.raw
      .get<RatingItem[]>("/server/rating/list")
      .then((items) => items ?? [])
      .catch((error) => {
        ratingListPromise = null;
        throw error;
      });
  }

  return ratingListPromise;
}

function getParams(ctx: Ctx) {
  const opts = {
    asc: ctx.get(ratingsState.filters.asc),
    cursor: ctx.get(ratingsState.filters.endCursor),
    server: ctx.get(ratingsState.filters.server),
  };

  const by = ctx.get(ratingsState.filters.by) as keyof RatingMap;

  return { by, opts };
}

export async function getRatings(
  by: keyof RatingMap,
  {
    endCursor,
    asc,
    limit = 50,
    server,
  }: {
    endCursor?: string;
    asc: boolean;
    limit?: number;
    server?: string;
  },
  init: RequestInit,
) {
  const opts = { limit, endCursor, asc, server };

  return client.raw
    .get<RatingsPayload>(`/server/rating/${by}`, {
      ...init,
      retry: 1,
      params: { query: opts }
    })
}

export const ratingsState = atom(null, "ratingsState").pipe(
  withAssign((_, name) => ({
    data: atom<RatingsPayload["data"] | null>(null, `${name}.data`).pipe(withReset()),
    meta: atom<RatingsPayload["meta"] | null>(null, `${name}.meta`).pipe(withReset()),
    loaded: atom(false, `${name}.loaded`).pipe(withReset()),
    filters: atom(null, `${name}.filters`).pipe(
      withAssign((_, name) => ({
        by: atom<RatingType>("playtime", `${name}.by`).pipe(withHistory(1)),
        server: atom<Maybe<string>>(undefined, `${name}.server`),
        asc: atom(false, `${name}.asc`),
        endCursor: atom<Maybe<string>>(undefined, `${name}.endCursor`).pipe(withReset())
      }))
    )
  }))
)

export const ratings = atom(null, "ratings").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      // The previous category/sort must not flash under the new columns.
      ratingsState.data.reset(ctx);
      ratingsState.meta.reset(ctx);
      ratingsState.loaded(ctx, false);
      ratingsState.filters.endCursor.reset(ctx);

      const { opts, by } = getParams(ctx);

      return await ctx.schedule(() =>
        getRatings(by, opts, { signal: ctx.controller.signal })
      );
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        batch(ctx, () => {
          ratingsState.data(ctx, res.data.length === 0 ? null : res.data);
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
    update: reatomAsync(async (ctx) => {
      const { by, opts } = getParams(ctx);

      return await ctx.schedule(() =>
        getRatings(by, opts, { signal: ctx.controller.signal })
      );
    }, {
      name: `${name}.update`,
      onFulfill: (ctx, res) => {
        batch(ctx, () => {
          type Row = RatingData[number];

          const prev = ctx.get(ratingsState.data) as Row[] | null;
          const fresh = res.data as Row[];

          const next: Row[] | null = fresh.length === 0
            ? prev
            : prev
              ? [...prev, ...fresh]
              : fresh;

          ratingsState.data(ctx, next as RatingData);
          ratingsState.meta(ctx, res.meta);
        });
      },
      onReject: (_, e) => {
        logError(e);
      },
    }).pipe(
      withStatusesAtom(),
      withErrorAtom(),
      withAbort()
    ),
    loadMore: action((ctx) => {
      if (ctx.get(ratings.update.statusesAtom).isPending) return;

      const meta = ctx.get(ratingsState.meta);
      if (!meta?.hasNextPage || !meta.endCursor) return;

      ratingsState.filters.endCursor(ctx, meta.endCursor);
      ratings.update(ctx);
    }, `${name}.loadMore`),
    applyFilters: action((ctx, next: Partial<RatingsPreferences>, options: { persist?: boolean, force?: boolean } = {}) => {
      const current: RatingsPreferences = {
        server: ctx.get(ratingsState.filters.server) ?? DEFAULT_RATINGS_PREFERENCES.server,
        type: ctx.get(ratingsState.filters.by),
        asc: ctx.get(ratingsState.filters.asc),
      };
      const merged = { ...current, ...next };

      if (!options.force && isSamePreferences(current, merged)) return;

      ratings.update.abort(ctx);
      ratingsState.filters.server(ctx, merged.server);
      ratingsState.filters.by(ctx, merged.type);
      ratingsState.filters.asc(ctx, merged.asc);
      ratingsState.filters.endCursor.reset(ctx);

      if (options.persist !== false) {
        try {
          writePreferencesCookie(merged);
          syncPreferencesUrl(merged);
        } catch (error) {
          logError(error);
        }
      }

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
      return await ctx.schedule(() => fetchRatingList())
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom()
    )
  }))
)
