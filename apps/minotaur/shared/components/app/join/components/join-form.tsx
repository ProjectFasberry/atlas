import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Typography } from "@/shared/ui/typography"
import { clsx } from "cnfast"
import { translate } from "@/shared/locales/helpers"
import { TEAM_ROLES, type TeamRole } from "@/shared/schemas/team"
import { joinState, submitJoin, toggleJoinRole } from "../models/join.model"

const ROLE_LABEL: Record<TeamRole, string> = {
  builder: "Строитель",
  developer: "Разработчик",
  designer: "Дизайнер",
  moderator: "Модератор",
  content: "Контент и переводы",
  other: "Другое",
}

const fieldClass = `
  w-full min-h-24 rounded-xl border border-neutral-800 bg-neutral-900 p-3
  text-sm text-neutral-50 outline-none duration-150 focus:border-neutral-600
`

const RolesPicker = reatomComponent(({ ctx }) => {
  const roles = ctx.spy(joinState.roles)

  return (
    <div className="flex flex-wrap gap-2">
      {TEAM_ROLES.map((role) => {
        const active = roles.includes(role)

        return (
          <Button
            key={role}
            type="button"
            background="default"
            className={clsx(
              "h-9 rounded-xl px-3 text-sm",
              active ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
            )}
            onClick={() => toggleJoinRole(ctx, role)}
          >
            {ROLE_LABEL[role]}
          </Button>
        )
      })}
    </div>
  )
}, "JoinRolesPicker")

const JoinError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(joinState.error)
  if (!error) return null

  return (
    <Typography className="text-sm text-red">
      {translate["team.join.error"]()}: {error}
    </Typography>
  )
}, "JoinError")

const JoinSuccess = () => (
  <div className="flex flex-col gap-3 rounded-xl border border-green-800/40 bg-green-900/10 p-4">
    <Typography variant="title">{translate["team.join.success-title"]()}</Typography>
    <Typography className="text-neutral-300">{translate["team.join.success-text"]()}</Typography>
  </div>
)

export const JoinForm = reatomComponent(({ ctx }) => {
  const submitted = ctx.spy(joinState.submitted)
  const isProcessing = ctx.spy(joinState.isProcessing)

  if (submitted) return <JoinSuccess />

  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl">
      <div className="flex flex-col gap-2">
        <Typography className="text-sm font-semibold text-neutral-300">
          {translate["team.join.roles"]()}
        </Typography>
        <RolesPicker />
      </div>

      <div className="flex flex-col gap-2">
        <Typography className="text-sm font-semibold text-neutral-300">
          {translate["team.join.about"]()}
        </Typography>
        <textarea
          className={fieldClass}
          value={ctx.spy(joinState.about)}
          placeholder={translate["team.join.about-placeholder"]()}
          maxLength={2000}
          onInput={(event) => joinState.about(ctx, event.currentTarget.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Typography className="text-sm font-semibold text-neutral-300">
            Telegram
          </Typography>
          <Input
            value={ctx.spy(joinState.telegram)}
            placeholder="@nickname"
            maxLength={64}
            onChange={(event) => joinState.telegram(ctx, event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Typography className="text-sm font-semibold text-neutral-300">
            Email
          </Typography>
          <Input
            type="email"
            value={ctx.spy(joinState.email)}
            placeholder="name@example.com"
            maxLength={128}
            onChange={(event) => joinState.email(ctx, event.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Typography className="text-sm font-semibold text-neutral-300">
          {translate["team.join.portfolio"]()}
        </Typography>
        <textarea
          className={fieldClass}
          value={ctx.spy(joinState.portfolio)}
          placeholder={translate["team.join.portfolio-placeholder"]()}
          maxLength={2000}
          onInput={(event) => joinState.portfolio(ctx, event.currentTarget.value)}
        />
      </div>

      <JoinError />

      <div className="flex items-center gap-3">
        <Button
          background="positive"
          className="h-11 px-5 font-semibold"
          disabled={isProcessing}
          onClick={() => submitJoin(ctx)}
        >
          {isProcessing ? translate["team.join.sending"]() : translate["team.join.submit"]()}
        </Button>
        <Typography className="text-xs text-neutral-500">
          {translate["team.join.cap-note"]()}
        </Typography>
      </div>
    </div>
  )
}, "JoinForm")
