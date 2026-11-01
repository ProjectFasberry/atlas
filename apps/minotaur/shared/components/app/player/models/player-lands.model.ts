import { action, reatomAsync, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { logError } from "@/shared/lib/log"
import { atom } from "@reatom/framework"
import { withAssign, withReset } from "@reatom/framework"
import { playerState } from "./player.model"
import { client } from "@/shared/lib/client-wrapper"
import { isEmptyArray } from "@/shared/lib/utils"
import { withSsr } from "@/shared/models/ssr"
import type { PageContextServer } from "vike/types"
import type { LandsSimilarPayload } from "../../lands/models/lands.model"

export async function getLands(nickname: string, init?: RequestInit) {
  return client
    .get<LandsSimilarPayload>(`server/lands/similar`, {
      ...init,
      searchParams: {
        variant: "by-player",
        target: nickname
      },
    })
    .exec()
}

export const playerLandsState = atom(null, "playerLandsState").pipe(
  withAssign((_, name) => ({
    data: atom<Nullable<LandsSimilarPayload>>(null, `${name}.data`).pipe(withSsr(`${name}.data`), withReset())
  }))
)

export const playerLands = atom(null, "playerLands").pipe(
  withAssign((_, name) => ({
    /**
     * Server-side only
     */
    init: action(async (ctx, pageCtx: PageContextServer) => {
      const headers = pageCtx.headers ?? undefined;
      const param = pageCtx.routeParams.nickname

      const lands = await getLands(param, { headers })
        .then(r => isEmptyArray(r?.data) ? null : r)
        .catch(e => {
          console.error("LANDS", e)
          return null;
        })

      playerLandsState.data(ctx, lands);
    }, `${name}.init`),
    fetch: reatomAsync(async (ctx) => {
      const nickname = ctx.get(playerState.nickname)
      if (!nickname) return null;

      playerLandsState.data.reset(ctx);
      return await ctx.schedule(() => getLands(nickname, { signal: ctx.controller.signal }))
    }, {
      name: `${name}.fetch`,
      onFulfill: (ctx, res) => res && playerLandsState.data(ctx, isEmptyArray(res.data) ? null : res),
      onReject: (_, e) => logError(e)
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

playerState.nickname.onChange((ctx, state) => state && playerLands.fetch(ctx))
