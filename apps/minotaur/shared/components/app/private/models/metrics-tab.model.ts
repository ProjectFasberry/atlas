import { atom } from "@reatom/framework"

export type MetricsTab = "players" | "builds"

/** Which metrics block the private metrics page shows. */
export const metricsTab = atom<MetricsTab>("players", "metricsTab")
