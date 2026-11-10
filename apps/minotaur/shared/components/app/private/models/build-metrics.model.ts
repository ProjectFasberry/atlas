import { atom, reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { panelClient } from "@/shared/lib/client-wrapper"

export type BuildMetricApp = "minotaur" | "wiki" | "taurus"

export const buildMetricsState = atom(null, "buildMetricsState").pipe(
	withAssign((_, name) => ({
		app: atom<BuildMetricApp>("minotaur", `${name}.app`),
	}))
)

export const loadBuildMetrics = reatomAsync(async (ctx) => {
	const app = ctx.get(buildMetricsState.app)

	return await panelClient.get("/metrics/build", {
		params: { query: { app, branch: "main", limit: 300 } },
	})
}, {
	name: "loadBuildMetrics",
	onReject: (_, error) => console.error("BUILD_METRICS", error),
}).pipe(
	withDataAtom([]),
	withStatusesAtom(),
	withErrorAtom(),
)
