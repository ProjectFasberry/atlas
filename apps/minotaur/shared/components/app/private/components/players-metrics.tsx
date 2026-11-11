import { reatomComponent, useUpdate } from "@reatom/npm-react"
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { clsx } from "cnfast"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { PageLoader } from "@/shared/ui/page-loader"
import { Typography } from "@/shared/ui/typography"
import { dayjs } from "@/shared/lib/dayjs"
import {
  PLAYERS_RANGES, playersMetrics, playersState, setPlayersRange, setPlayersServer,
  type PlayersPoint, type PlayersRange,
} from "../models/players-metrics.model"

const COLORS = {
  joins: "#1db954",
  quits: "#f4645a",
  unique: "#5b8def",
}

const card = "flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-3"

const StatCard = ({ title, value, hint }: { title: string, value: string, hint?: string }) => (
  <div className={card}>
    <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{title}</span>
    <span className="text-xl font-semibold text-neutral-50">{value}</span>
    {hint && <span className="text-xs text-neutral-500">{hint}</span>}
  </div>
)

const formatPoint = (at: string, range: PlayersRange) =>
  dayjs(at).format(range === "24h" ? "HH:mm" : "DD.MM HH:mm")

const PlayersChart = ({ series, range }: { series: PlayersPoint[], range: PlayersRange }) => {
  const data = series.map((point) => ({
    label: formatPoint(point.at, range),
    joins: point.joins,
    quits: point.quits,
    unique: point.unique,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: "#737373", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a3a3a3" }}
          />
          <Area type="monotone" dataKey="joins" name="Входы" stroke={COLORS.joins} fill={COLORS.joins} fillOpacity={0.15} strokeWidth={2} />
          <Area type="monotone" dataKey="quits" name="Выходы" stroke={COLORS.quits} fill={COLORS.quits} fillOpacity={0.1} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

const ServersChart = ({ servers }: { servers: { server: string, online: number }[] }) => {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={servers} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#262626" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="server" tick={{ fill: "#737373", fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: "#737373", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#171717", border: "1px solid #262626", borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: "#a3a3a3" }}
          />
          <Bar dataKey="online" name="Онлайн" fill={COLORS.unique} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

const RangeSwitch = reatomComponent(({ ctx }) => {
  const range = ctx.spy(playersState.range)

  return (
    <div className="flex items-center gap-1">
      {PLAYERS_RANGES.map((option) => (
        <Button
          key={option.value}
          background="default"
          className={clsx(
            "h-7 rounded-lg px-2 text-xs",
            range === option.value ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
          )}
          onClick={() => setPlayersRange(ctx, option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  )
}, "PlayersRangeSwitch")

const ServerSwitch = reatomComponent<{ servers: string[] }>(({ ctx, servers }) => {
  const selected = ctx.spy(playersState.server)

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        background="default"
        className={clsx(
          "h-7 rounded-lg px-2 text-xs",
          selected === null ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
        )}
        onClick={() => setPlayersServer(ctx, null)}
      >
        Все
      </Button>
      {servers.map((server) => (
        <Button
          key={server}
          background="default"
          className={clsx(
            "h-7 rounded-lg px-2 text-xs",
            selected === server ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
          )}
          onClick={() => setPlayersServer(ctx, server)}
        >
          {server}
        </Button>
      ))}
    </div>
  )
}, "PlayersServerSwitch")

const LiveBadge = reatomComponent(({ ctx }) => {
  const connected = ctx.spy(playersState.connected)

  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
      <span className={clsx("size-2 rounded-full", connected ? "bg-green-500" : "bg-neutral-600")} />
      {connected ? "live" : "offline"}
    </span>
  )
}, "PlayersLiveBadge")

const RecentEvents = reatomComponent(({ ctx }) => {
  const recent = ctx.spy(playersState.recent)
  if (recent.length === 0) return <Noop />

  return (
    <div className="flex flex-col gap-1">
      {recent.map((event, index) => (
        <div
          key={`${event.date}-${event.name}-${index}`}
          className="flex items-center justify-between gap-2 rounded-lg border border-neutral-800 px-2 py-1 text-xs"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={clsx("size-1.5 shrink-0 rounded-full", event.type === "join" ? "bg-green-500" : "bg-red")} />
            <Typography className="truncate text-sm">{event.name}</Typography>
            <span className="text-neutral-500">{event.server}</span>
          </div>
          <span className="shrink-0 text-neutral-500">{dayjs(event.date).format("HH:mm:ss")}</span>
        </div>
      ))}
    </div>
  )
}, "PlayersRecentEvents")

export const PlayersMetrics = reatomComponent(({ ctx }) => {
  useUpdate(playersMetrics, [])

  // Spy the snapshot first: it owns the SSE connection through onConnect.
  const response = ctx.spy(playersMetrics.dataAtom)
  const statuses = ctx.spy(playersMetrics.statusesAtom)
  const error = ctx.spy(playersMetrics.errorAtom)

  if (statuses.isFirstPending) return <PageLoader />
  if (error) return <ErrorBlock title={error.message} />
  if (!response) return <Noop />

  const summary = response.data
  const range = ctx.spy(playersState.range)
  const live = ctx.spy(playersState.live)

  // The snapshot is the base; SSE deltas keep the counters moving until the next fetch.
  const byServer = new Map<string, number>()
  for (const entry of summary.online.byServer) {
    byServer.set(entry.server ?? "unknown", entry.online)
  }
  for (const [server, delta] of Object.entries(live)) {
    byServer.set(server, (byServer.get(server) ?? 0) + delta)
  }

  const servers = [...byServer.entries()]
    .map(([server, online]) => ({ server, online: Math.max(0, online) }))
    .sort((a, b) => b.online - a.online)

  const onlineTotal = servers.reduce((sum, entry) => sum + entry.online, 0)
  const totals = summary.totals

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RangeSwitch />
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button
            background="default"
            className="h-7 rounded-lg px-2 text-xs"
            onClick={() => playersMetrics(ctx)}
          >
            Обновить
          </Button>
        </div>
      </div>

      <ServerSwitch servers={summary.servers} />

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <StatCard title="Онлайн" value={String(onlineTotal)} hint={`${servers.length} серверов`} />
        <StatCard title="Входы" value={String(totals.joins)} hint="за период" />
        <StatCard title="Выходы" value={String(totals.quits)} hint="за период" />
        <StatCard title="Уникальные" value={String(totals.unique)} hint="за период" />
        <StatCard title="Пик онлайна" value={String(totals.peakOnline)} hint="по часам" />
      </div>

      <div className={card}>
        <Typography className="text-sm font-semibold">Входы и выходы</Typography>
        <PlayersChart series={summary.series} range={range} />
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        <div className={card}>
          <Typography className="text-sm font-semibold">Онлайн по серверам</Typography>
          <ServersChart servers={servers} />
        </div>
        <div className={card}>
          <Typography className="text-sm font-semibold">Последние события</Typography>
          <RecentEvents />
        </div>
      </div>
    </div>
  )
}, "PlayersMetrics")
