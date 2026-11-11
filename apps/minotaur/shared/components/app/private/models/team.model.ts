import { reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom, atom } from "@reatom/framework"
import { client } from "@/shared/lib/client-wrapper"
import type { TeamStatus } from "@/shared/schemas/team"

export type TeamApplication = ExtractApiData<"getPrivatedTeamList">["data"][number]

export const teamState = atom(null, "teamState").pipe(
  withAssign((_, name) => ({
    status: atom<TeamStatus | null>(null, `${name}.status`),
  }))
)

export const loadTeamApplications = reatomAsync(async (ctx) => {
  const status = ctx.get(teamState.status)

  return await client.get("/privated/team/list", {
    params: { query: status ? { status } : {} },
  })
}, {
  name: "loadTeamApplications",
  onReject: (_, error) => console.error("TEAM_APPLICATIONS", error),
}).pipe(
  withDataAtom([]),
  withStatusesAtom(),
  withErrorAtom()
)

export const setTeamApplicationStatus = reatomAsync(async (ctx, id: number, status: TeamStatus) => {
  return await client.post("/privated/team/{id}/status", {
    params: { path: { id: String(id) } },
    json: { status },
  })
}, {
  name: "setTeamApplicationStatus",
  onFulfill: (ctx, updated) => {
    loadTeamApplications.dataAtom(ctx, (list) =>
      list.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item)
    )
  },
  onReject: (_, error) => console.error("TEAM_STATUS", error),
}).pipe(
  withStatusesAtom(),
  withErrorAtom()
)
