import type { PlayersPoint, PlayersRange, PlayersSummary, PresenceEvent } from "./players-metrics.model"

/**
 * Demo data for the players metrics page. Enabled explicitly with `?mock` in the
 * URL, so the page can be reviewed without a running presence pipeline and
 * without writing fake rows into the database.
 */
const SERVERS = ["bisquite", "lobby", "creative", "skyblock"]
const NAMES = ["Steve", "Alex", "Herobrine", "Notch", "Dinnerbone", "jeb_", "Grumm", "Hypixel", "Ph1lza", "CaptainSparklez"]

const RANGE_MS: Record<PlayersRange, number> = {
	"24h": 24 * 60 * 60 * 1000,
	"7d": 7 * 24 * 60 * 60 * 1000,
	"30d": 30 * 24 * 60 * 60 * 1000,
}

const BUCKET_MS: Record<PlayersRange, number> = {
	"24h": 60 * 60 * 1000,
	"7d": 6 * 60 * 60 * 1000,
	"30d": 24 * 60 * 60 * 1000,
}

/** Deterministic noise so a redraw does not reshuffle the whole chart. */
const hash = (input: number) => {
	const value = Math.sin(input * 12.9898) * 43758.5453
	return value - Math.floor(value)
}

const pick = <T,>(items: T[], index: number) => items[Math.floor(hash(index) * items.length) % items.length]

export const isMockEnabled = (): boolean => {
	if (typeof window === "undefined") return false

	return new URLSearchParams(window.location.search).has("mock")
}

export function createMockSummary(range: PlayersRange, server: string | null): PlayersSummary {
	const to = new Date()
	const from = new Date(to.getTime() - RANGE_MS[range])
	const bucket = BUCKET_MS[range]
	const buckets = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / bucket))

	const series: PlayersPoint[] = Array.from({ length: buckets }, (_, index) => {
		const joins = Math.round(6 + hash(index + 1) * 22)
		const quits = Math.max(0, joins - Math.round(hash(index + 7) * 4))

		return {
			at: new Date(from.getTime() + index * bucket).toISOString(),
			joins,
			quits,
			unique: Math.round(joins * (0.6 + hash(index + 3) * 0.3)),
		}
	})

	const byServer = SERVERS.map((name, index) => ({
		server: name,
		online: Math.round(4 + hash(index + 11) * 26),
	})).filter((entry) => !server || entry.server === server)

	const totals = series.reduce(
		(acc, point) => ({
			joins: acc.joins + point.joins,
			quits: acc.quits + point.quits,
			unique: acc.unique + point.unique,
		}),
		{ joins: 0, quits: 0, unique: 0 },
	)

	return {
		online: {
			total: byServer.reduce((sum, entry) => sum + entry.online, 0),
			byServer,
		},
		servers: SERVERS,
		series,
		totals: { ...totals, peakOnline: Math.max(...series.map((point) => point.joins)) },
		range: { from: from.toISOString(), to: to.toISOString(), server },
	}
}

/** Emits a presence event every few seconds and returns the stop function. */
export function startMockStream(onEvent: (event: PresenceEvent) => void): () => void {
	let index = 0

	const interval = setInterval(() => {
		index += 1
		onEvent({
			type: hash(index) > 0.45 ? "join" : "quit",
			date: new Date().toISOString(),
			name: pick(NAMES, index),
			server: pick(SERVERS, index + 5),
		})
	}, 3_500)

	return () => clearInterval(interval)
}
