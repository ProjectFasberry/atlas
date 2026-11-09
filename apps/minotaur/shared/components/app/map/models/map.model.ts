import { client } from "@/shared/lib/client-wrapper"
import { logError } from "@/shared/lib/log"
import {
  atom, reatomAsync,
  withAbort, withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"

export type AvailableServersPayload = ExtractApiData<"getServers-with-map">["data"]
export type AvailableServer = AvailableServersPayload[number]

export const availableServers = atom(null, "availableServers").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await ctx.schedule(() =>
        client.get("/servers-with-map", { signal: ctx.controller.signal })
      )
    }, {
      name: `${name}.fetch`,
      onReject: (_, error) => logError(error),
    }).pipe(
      withDataAtom(null),
      withCache({ swr: false }),
      withStatusesAtom(),
      withAbort(),
      withErrorAtom(),
    ),
  }))
)
