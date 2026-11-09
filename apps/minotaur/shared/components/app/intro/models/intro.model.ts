import { client } from "@/shared/lib/client-wrapper";
import { reatomAsync, withCache, withDataAtom, withRetry, withStatusesAtom } from "@reatom/framework";
import { atom } from "@reatom/framework";
import { withAssign } from "@reatom/framework";

type StatusPayload = ExtractApiData<"getServerStatus">["data"]

export const serverStatus = atom(null, "serverStatus").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() => client.raw
        .get<StatusPayload>("/server/status", {
          signal: ctx.controller.signal,
          params: { query: { type: "servers" } }
        })
      )
    }, `${name}.fetch`).pipe(
      withStatusesAtom(),
      withCache({ swr: false, staleTime: 60000 }),
      withDataAtom(null),
      withRetry()
    )
  }))
)
