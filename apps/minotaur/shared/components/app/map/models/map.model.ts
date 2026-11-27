import { client } from "@/shared/lib/client-wrapper"
import { logError } from "@/shared/lib/log"
import { serverStatus } from "@/shared/components/app/intro/models/intro.model"
import {
  atom, onConnect, reatomAsync, sleep,
  withAbort, withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom,
} from "@reatom/framework"

// The map page embeds one server at a time. `null` means "the first server the
// API returns", so the page still works when the list changes.
export const mapServerAtom = atom<string | null>(null, "mapServerAtom")

export type AvailableServersPayload = ExtractApiData<"getServers-with-map">["data"]
export type AvailableServer = AvailableServersPayload[number]

export type MapSort = "online" | "name"
export const mapSortAtom = atom<MapSort>("online", "mapSort")

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

onConnect(serverStatus.fetch.dataAtom, serverStatus.fetch)

onConnect(serverStatus.fetch.dataAtom, async (ctx) => {
  while (ctx.isConnected()) {
    await serverStatus.fetch.retry(ctx).catch(() => { })
    await ctx.schedule(() => sleep(60000))
  }
})
