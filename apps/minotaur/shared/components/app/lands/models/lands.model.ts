import { isEmptyArray } from "@/shared/lib/utils";
import { client, withQueryParams } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import { pageState } from "@/shared/models/page-context.model";
import { atom, reatomAsync, withAbort, withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";

export type LandsSimilarParams = ExtractApiParams<"getServerLandsSimilar">["query"];

export type LandsSimilarPayload = ExtractApiData<"getServerLandsSimilar">["data"]
export type LandSimilar = NonNullable<LandsSimilarPayload>["data"][number];

export const lands = atom(null, "lands").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx, params?: Partial<LandsSimilarParams> & { limit?: number }) => {
      const param = ctx.get(pageState.urlParsed)?.search["from"];
      const fromIndex = param === 'index';

      if (fromIndex) {
        lands.fetch.dataAtom.reset(ctx)
        lands.fetch.cacheAtom.reset(ctx)
      }

      const searchParams: LandsSimilarParams = {
        limit: params?.limit,
        variant: params?.variant ?? "random"
      }

      return await ctx.schedule(() => client
        .get<LandsSimilarPayload>("server/lands/similar", {
          signal: ctx.controller.signal,
        })
        .pipe(withQueryParams(searchParams))
        .exec()
      )
    }, {
      name: `${name}.fetch`,
      onReject: (_, e) => {
        logError(e, { type: "combined" })
      }
    }).pipe(
      withDataAtom(null, (_, data) => data ? isEmptyArray(data.data) ? null : data.data : null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom(),
      withAbort()
    )
  }))
)
