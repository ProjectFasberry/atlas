import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { ErrorBlock } from "@/shared/ui/error-block"
import { Noop } from "@/shared/ui/noop"
import { PageLoader } from "@/shared/ui/page-loader"
import { Typography } from "@/shared/ui/typography"
import { clsx } from "cnfast"
import { dayjs } from "@/shared/lib/dayjs"
import { TEAM_STATUSES, type TeamStatus } from "@/shared/schemas/team"
import { loadTeamApplications, setTeamApplicationStatus, teamState, type TeamApplication } from "../models/team.model"

const STATUS_LABEL: Record<TeamStatus, string> = {
  new: "Новые",
  reviewed: "Просмотрены",
  invited: "Приглашены",
  rejected: "Отклонены",
}

const StatusFilter = reatomComponent(({ ctx }) => {
  const selected = ctx.spy(teamState.status)

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        background="default"
        className={clsx("h-7 rounded-lg px-2 text-xs", selected === null ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800")}
        onClick={() => { teamState.status(ctx, null); loadTeamApplications(ctx) }}
      >
        Все
      </Button>
      {TEAM_STATUSES.map((status) => (
        <Button
          key={status}
          background="default"
          className={clsx("h-7 rounded-lg px-2 text-xs", selected === status ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800")}
          onClick={() => { teamState.status(ctx, status); loadTeamApplications(ctx) }}
        >
          {STATUS_LABEL[status]}
        </Button>
      ))}
    </div>
  )
}, "TeamStatusFilter")

const StatusActions = reatomComponent<{ id: number, status: TeamStatus }>(({ ctx, id, status }) => {
  const isPending = ctx.spy(setTeamApplicationStatus.statusesAtom).isPending

  return (
    <div className="flex items-center gap-1">
      {TEAM_STATUSES.filter((next) => next !== status).map((next) => (
        <Button
          key={next}
          background="default"
          className="h-7 rounded-lg px-2 text-xs bg-neutral-800"
          disabled={isPending}
          onClick={() => setTeamApplicationStatus(ctx, id, next)}
        >
          {STATUS_LABEL[next]}
        </Button>
      ))}
    </div>
  )
}, "TeamStatusActions")

const ApplicationCard = reatomComponent<{ application: TeamApplication }>(({ application }) => {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Typography className="font-semibold">{application.nickname}</Typography>
          <span className="rounded-lg bg-neutral-800 px-1.5 py-0.5 text-[11px] font-semibold text-neutral-300">
            {STATUS_LABEL[application.status]}
          </span>
          <span className="text-xs text-neutral-500">
            {dayjs(application.createdAt).format("DD.MM.YYYY HH:mm")}
          </span>
        </div>
        <StatusActions id={application.id} status={application.status} />
      </div>

      <div className="flex flex-wrap gap-1">
        {application.roles.map((role) => (
          <span key={role} className="rounded-lg bg-green-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-green-400">
            {role}
          </span>
        ))}
      </div>

      <Typography className="text-sm text-neutral-300 whitespace-pre-wrap">
        {application.about}
      </Typography>

      <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400">
        <a href={`https://t.me/${application.telegram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="hover:text-neutral-100">
          Telegram: {application.telegram}
        </a>
        {application.email && (
          <a href={`mailto:${application.email}`} className="hover:text-neutral-100">Email: {application.email}</a>
        )}
        {application.portfolio && (
          <span className="truncate max-w-full whitespace-pre-wrap">Портфолио: {application.portfolio}</span>
        )}
      </div>
    </div>
  )
}, "TeamApplicationCard")

export const TeamApplications = reatomComponent(({ ctx }) => {
  useUpdate(loadTeamApplications, [])

  if (ctx.spy(loadTeamApplications.statusesAtom).isFirstPending) return <PageLoader />

  const error = ctx.spy(loadTeamApplications.errorAtom)
  if (error) return <ErrorBlock title={error.message} />

  const list = ctx.spy(loadTeamApplications.dataAtom)
  if (list.length === 0) return <Noop />

  return (
    <div className="flex flex-col gap-3 w-full">
      <StatusFilter />
      <div className="flex flex-col gap-2">
        {list.map((application) => <ApplicationCard key={application.id} application={application} />)}
      </div>
    </div>
  )
}, "TeamApplications")
