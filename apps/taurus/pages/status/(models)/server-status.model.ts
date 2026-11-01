import { mainClient } from "@/shared/api/client";
import { reatomAsync, withAbort, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { atom, withAssign } from "@reatom/framework";

export type Player = { uuid: string; name_raw: string };
export type PlayerStatusProps = { nickname: string }

export const serverStatus = atom(null, "serverStatus").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      const cb = await mainClient
        .GET("/server/status", {
          searchParams: { type: "servers" },
          signal: ctx.controller.signal
        })
        .then(r => r.data?.data ?? null)

      return await ctx.schedule(() => cb)
    }, `${name}.fetch`).pipe(
      withCache({ swr: false }),
      withDataAtom(),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom()
    )
  }))
)
