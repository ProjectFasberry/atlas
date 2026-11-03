import {
  withReset, atom, batch, type Ctx, reatomAsync, withAbort,
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
import { client, withQueryParams } from "@/shared/lib/client-wrapper";
import { createViewerModel } from "@/shared/models/shared.model";

type RatingMap = {
  playtime: RatingPlaytime[];
  lands_chunks: RatingLands[];
  reputation: RatingReputation[];
  charism: RatingCharism[];
  belkoin: RatingBelkoin[];
  parkour: RatingParkour[];
};

export const { Component: RatingsViewer, inViewAtom: ratingIsViewAtom } = createViewerModel({
  name: "ratings-list",
})

// type RatingsParams = ExtractApiParams<"getServerRatingList">["query"]

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

  return client
    .get<RatingsPayload>(`server/rating/${by}`, {
      ...init,
      retry: 1
    })
    .pipe(withQueryParams(opts))
    .exec();
}

export const ratingsState = atom(null, "ratingsState").pipe(
  withAssign((_, name) => ({
    data: atom<RatingsPayload["data"] | null>(null, `${name}.data`).pipe(withReset()),
    meta: atom<RatingsPayload["meta"] | null>(null, `${name}.meta`).pipe(withReset()),
    filters: atom(null, `${name}.filters`).pipe(
      withAssign((_, name) => ({
        by: atom<string>("playtime", `${name}.by`).pipe(withHistory(1)),
        server: atom<Maybe<string>>(undefined, "ratingServer"),
        asc: atom(false, "ratingAsc"),
        endCursor: atom<Maybe<string>>(undefined, "ratingEndCursor").pipe(withReset())
      }))
    )
  }))
)

export const ratings = atom(null, "ratings").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const { opts, by } = getParams(ctx);

      return await ctx.schedule(() => getRatings(by, opts, { signal: ctx.controller.signal }));
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => {
        batch(ctx, () => {
          ratingsState.data(ctx, res.data.length === 0 ? null : res.data);
          ratingsState.meta(ctx, res.meta);
        });
      },
      onReject: (_, e) => logError(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    ),
    update: reatomAsync(async (ctx) => {
      const { by, opts } = getParams(ctx);

      return await ctx.schedule(() => getRatings(by, opts, { signal: ctx.controller.signal }));
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
    )
  }))
)

ratingIsViewAtom.onChange((ctx, state) => {
  if (!state) return;

  const meta = ctx.get(ratingsState.meta);
  const hasMore = meta?.hasNextPage && !!meta?.endCursor;

  if (hasMore) {
    ratingsState.filters.endCursor(ctx, meta.endCursor);
    ratings.update(ctx);
  }
});

ratingsState.filters.asc.onChange((ctx) => {
  ratings.update.abort(ctx);
  ratingsState.filters.endCursor.reset(ctx);
  ratings.fetch(ctx);
});

export type RatingItem = Pick<{ title: string; childs: string[] }, "title"> & {
  childs: { title: string, value: string }[],
  key: string
};

export const rating = atom(null, "rating").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client<RatingItem[]>("server/rating/list").exec())
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom()
    )
  }))
)
