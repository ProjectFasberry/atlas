import {
  action, atom, type Ctx, onConnect, onDisconnect, reatomAsync,
  withAssign, withDataAtom, withErrorAtom, withReset, withStatusesAtom,
} from "@reatom/framework"
import { apiBaseUrl } from "@/shared/env"
import { client } from "@/shared/lib/client-wrapper"

export type PlayersRange = "24h" | "7d" | "30d"

export type PlayersPoint = { at: string, joins: number, quits: number, unique: number }

export type PlayersOnline = { server: string | null, online: number }

export type PlayersSummary = ExtractApiData<"getPrivatedMetricsPlayers">["data"]

export type PresenceEvent = {
  type: "join" | "quit",
  date: string,
  name: string,
  server: string,
}

const RANGE_MS: Record<PlayersRange, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
}

export const PLAYERS_RANGES: { value: PlayersRange, label: string }[] = [
  { value: "24h", label: "24 часа" },
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
]

export const playersState = atom(null, "playersState").pipe(
  withAssign((_, name) => ({
    range: atom<PlayersRange>("24h", `${name}.range`).pipe(withReset()),
    server: atom<string | null>(null, `${name}.server`).pipe(withReset()),
    /** Deltas received over SSE since the last snapshot fetch. */
    live: atom<Record<string, number>>({}, `${name}.live`),
    recent: atom<PresenceEvent[]>([], `${name}.recent`),
    connected: atom(false, `${name}.connected`),
  }))
)

export const setPlayersRange = action((ctx, range: PlayersRange) => {
  playersState.range(ctx, range)
  playersMetrics(ctx)
}, "setPlayersRange")

export const setPlayersServer = action((ctx, server: string | null) => {
  playersState.server(ctx, server)
  playersMetrics(ctx)
}, "setPlayersServer")

export const playersMetrics = reatomAsync(async (ctx) => {
  const range = ctx.get(playersState.range)
  const server = ctx.get(playersState.server)
  const to = new Date()
  const from = new Date(to.getTime() - RANGE_MS[range])

  return await client.get("/privated/metrics/players", {
    params: {
      query: {
        from: from.toISOString(),
        to: to.toISOString(),
        ...(server ? { server } : {}),
      },
    },
  })
}, {
  name: "playersMetrics.fetch",
  onFulfill: (ctx) => {
    // The snapshot is the new base for the live deltas.
    playersState.live(ctx, {})
  },
  onReject: (_, error) => console.error("PLAYERS_METRICS", error),
}).pipe(
  withDataAtom(null),
  withStatusesAtom(),
  withErrorAtom()
)

const applyPresence = (ctx: Ctx, presence: PresenceEvent) => {
  const server = presence.server || "unknown"
  const delta = presence.type === "join" ? 1 : -1

  playersState.live(ctx, (state) => ({ ...state, [server]: (state[server] ?? 0) + delta }))
  playersState.recent(ctx, (state) => [presence, ...state].slice(0, 20))
}

let source: EventSource | null = null

export const connectPlayersStream = action((ctx) => {
  if (typeof window === "undefined") return
  if (source) return

  if (typeof EventSource === "undefined") return

  source = new EventSource(`${apiBaseUrl}/privated/metrics/players/stream`, { withCredentials: true })

  source.onopen = () => playersState.connected(ctx, true)
  source.onerror = () => playersState.connected(ctx, false)
  source.onmessage = (event) => applyPresence(ctx, JSON.parse(event.data) as PresenceEvent)
}, "connectPlayersStream")

export const disconnectPlayersStream = action((ctx) => {
  source?.close()
  source = null
  playersState.connected(ctx, false)
}, "disconnectPlayersStream")

// The page owns the connection: it lives exactly as long as the summary atom is read.
onConnect(playersMetrics.dataAtom, (ctx) => {
  connectPlayersStream(ctx)
})

onDisconnect(playersMetrics.dataAtom, (ctx) => {
  disconnectPlayersStream(ctx)
})
