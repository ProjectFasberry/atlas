import { reatomAsync, withAssign, withDataAtom, withErrorAtom, withStatusesAtom, atom } from "@reatom/framework"
import { client } from "@/shared/lib/client-wrapper"
import type { TeamStatus } from "@/shared/schemas/team"

export type TeamApplication = {
  id: number
  nickname: string
  uuid: string | null
  roles: string[]
  about: string
  telegram: string
  email: string | null
  portfolio: string | null
  status: TeamStatus
  createdAt: string
}

export const teamState = atom(null, "teamState").pipe(
  withAssign((_, name) => ({
    status: atom<TeamStatus | null>(null, `${name}.status`),
  }))
)

export const loadTeamApplications = reatomAsync(async (ctx) => {
  const status = ctx.get(teamState.status)

  return await client.raw.get<TeamApplication[]>("/privated/team/list", {
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
  return await client.raw.post<{ id: number, status: TeamStatus }>(`/privated/team/${id}/status`, {
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
