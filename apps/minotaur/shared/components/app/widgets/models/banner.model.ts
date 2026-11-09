import { client } from "@/shared/lib/client-wrapper";
import { logError } from "@/shared/lib/log";
import { appState } from "@/shared/models/app/index.model";
import { reatomAsync, withCache, withDataAtom, withErrorAtom, withStatusesAtom, type AtomState } from "@reatom/framework";
import { action, atom } from "@reatom/framework";
import { withAssign } from "@reatom/framework";

type BannerPayload = ExtractApiData<"getBannerLatest">["data"]

export const bannerIsExistsAtom = atom((ctx) => ctx.spy(appState.options)?.flags?.isBanner, "bannerIsExists")

export const banner = atom(null, "banner").pipe(
  withAssign((_, name) => ({
    refetchAll: action((ctx) => {
      banner.fetch.cacheAtom.reset(ctx)
      banner.fetch.dataAtom.reset(ctx);
    }),
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/banner/latest", { signal: ctx.controller.signal })
      )
    }, `${name}.fetch`).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withErrorAtom()
    ),
    createView: reatomAsync(async (ctx, id: number) => {
      return await ctx.schedule(() => client
        .post("/banner/view/{id}", { params: { path: { id } } })
      )
    }, {
      name: `${name}.createView`,
      onFulfill: (ctx, res) => {
        appState.options(ctx, (state) => {
          const prev = state as NonNullable<AtomState<typeof appState.options>>
          return { ...prev, flags: { ...prev.flags, isBanner: false } }
        })

        banner.refetchAll(ctx)
      },
      onReject: (_, e) => logError(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

bannerIsExistsAtom.onChange((ctx, state) => state && banner.fetch(ctx))
