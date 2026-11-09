import { reatomComponent, useUpdate } from "@reatom/npm-react"
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import { clsx } from "cnfast"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { PageLoader } from "@/shared/ui/page-loader"
import { Typography } from "@/shared/ui/typography"
import { dayjs } from "@/shared/lib/dayjs"
import { buildMetricsState, loadBuildMetrics, type BuildMetricApp } from "../models/build-metrics.model"

const APPS: { value: BuildMetricApp, label: string }[] = [
	{ value: "minotaur", label: "minotaur" },
	{ value: "wiki", label: "wiki" },
	{ value: "taurus", label: "taurus" },
]

const COLORS = {
	total: "#1db954",
	client: "#5b8def",
	server: "#f4b942",
}

const toMb = (bytes: number) => bytes / 1024 / 1024

const formatBytes = (bytes: number) => {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${toMb(bytes).toFixed(2)} MB`
}

const StatCard = ({ title, value, hint }: { title: string, value: string, hint?: string }) => (
	<div className="flex flex-col gap-1 rounded-xl border border-neutral-800 bg-neutral-900 p-3">
		<span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{title}</span>
		<span className="text-xl font-semibold text-neutral-50">{value}</span>
		{hint && <span className="text-xs text-neutral-500">{hint}</span>}
	</div>
)

const AppTabs = reatomComponent(({ ctx }) => {
	const active = ctx.spy(buildMetricsState.app)

	return (
		<div className="flex flex-wrap items-center gap-1">
			{APPS.map((app) => (
				<Button
					key={app.value}
					background={active === app.value ? "white" : "default"}
					className={clsx(
						"h-8 px-3 text-xs font-semibold",
						active === app.value ? "text-neutral-950" : "text-neutral-300",
					)}
					onClick={() => buildMetricsState.app(ctx, app.value)}
				>
					{app.label}
				</Button>
			))}
		</div>
	)
}, "BuildMetricsAppTabs")

export const BuildMetrics = reatomComponent(({ ctx }) => {
	const app = ctx.spy(buildMetricsState.app)
	useUpdate(loadBuildMetrics, [app])

	const data = ctx.spy(loadBuildMetrics.dataAtom)
	const status = ctx.spy(loadBuildMetrics.statusesAtom)
	const error = ctx.spy(loadBuildMetrics.errorAtom)

	if (status.isFirstPending) return <PageLoader />
	if (error) return <ErrorBlock title={error.message} />

	const latest = data[0]
	const chartData = [...data].reverse().map((row) => ({
		date: dayjs(row.createdAt).format("DD.MM HH:mm"),
		total: toMb(row.metrics.totalBytes),
		client: toMb(row.metrics.clientJsBytes),
		server: toMb(row.metrics.serverJsBytes),
	}))

	return (
		<div className="flex flex-col gap-3 w-full min-w-0">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<AppTabs />
				<Typography color="gray" className="text-xs">
					main · последние {data.length} записей
				</Typography>
			</div>

			{latest && (
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
					<StatCard title="Всего" value={formatBytes(latest.metrics.totalBytes)} hint={dayjs(latest.createdAt).format("DD.MM.YYYY HH:mm")} />
					<StatCard title="Client JS" value={formatBytes(latest.metrics.clientJsBytes)} />
					<StatCard title="Server JS" value={formatBytes(latest.metrics.serverJsBytes)} />
					<StatCard title="Commit" value={latest.commitSha.slice(0, 7)} hint={latest.stage} />
				</div>
			)}

			{chartData.length === 0 ? (
				<Noop title="Для этого приложения ещё нет замеров" />
			) : (
				<div className="h-[360px] w-full rounded-xl border border-neutral-800 bg-neutral-900 p-2 sm:p-4">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
							<CartesianGrid stroke="#2b2b2b" strokeDasharray="3 3" />
							<XAxis dataKey="date" stroke="#8b8b8b" tick={{ fontSize: 11 }} minTickGap={24} />
							<YAxis
								stroke="#8b8b8b"
								tick={{ fontSize: 11 }}
								width={54}
								tickFormatter={(value) => `${Number(value).toFixed(1)} MB`}
							/>
							<Tooltip
								contentStyle={{ background: "#171717", border: "1px solid #2b2b2b", borderRadius: 12 }}
								labelStyle={{ color: "#d4d4d4" }}
								formatter={(value) => `${Number(value).toFixed(2)} MB`}
							/>
							<Legend />
							<Line type="monotone" dataKey="total" name="total" stroke={COLORS.total} strokeWidth={2} dot={false} />
							<Line type="monotone" dataKey="client" name="client JS" stroke={COLORS.client} strokeWidth={2} dot={false} />
							<Line type="monotone" dataKey="server" name="server JS" stroke={COLORS.server} strokeWidth={2} dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	)
}, "BuildMetrics")
