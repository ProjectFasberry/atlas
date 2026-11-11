import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Typography } from "@/shared/ui/typography"
import { clsx } from "cnfast"
import { translate } from "@/shared/locales/helpers"
import { TEAM_CONTACTS, TEAM_ROLES, type TeamContactType, type TeamRole } from "@/shared/schemas/team"
import { joinState, submitJoin, toggleJoinRole } from "../models/join.model"

const ROLE_TITLE: Record<TeamRole, string> = {
  builder: "team.join.role-builder",
  developer: "team.join.role-developer",
  designer: "team.join.role-designer",
  moderator: "team.join.role-moderator",
  content: "team.join.role-content",
  other: "team.join.role-other",
}

const ROLE_DESCRIPTION: Record<TeamRole, string> = {
  builder: "team.join.role-builder-desc",
  developer: "team.join.role-developer-desc",
  designer: "team.join.role-designer-desc",
  moderator: "team.join.role-moderator-desc",
  content: "team.join.role-content-desc",
  other: "team.join.role-other-desc",
}

const fieldClass = `
  w-full min-h-24 rounded-xl border border-neutral-800 bg-neutral-900 p-3
  text-sm text-neutral-50 outline-none duration-150 focus:border-neutral-600
`

const RolesPicker = reatomComponent(({ ctx }) => {
  const roles = ctx.spy(joinState.roles)

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {TEAM_ROLES.map((role) => {
        const active = roles.includes(role)

        return (
          <button
            key={role}
            type="button"
            onClick={() => toggleJoinRole(ctx, role)}
            data-state={active ? "selected" : "default"}
            className={clsx(
              "flex flex-col gap-1 rounded-xl border p-3 text-left duration-150",
              active
                ? "border-green-600/60 bg-green-500/10"
                : "border-neutral-800 bg-neutral-900 hover:border-neutral-700",
            )}
          >
            <Typography className="text-sm font-semibold">
              {/* @ts-expect-error paraglide keys are generated from messages */}
              {translate[ROLE_TITLE[role]]()}
            </Typography>
            <Typography className="text-xs text-neutral-500">
              {/* @ts-expect-error paraglide keys are generated from messages */}
              {translate[ROLE_DESCRIPTION[role]]()}
            </Typography>
          </button>
        )
      })}
    </div>
  )
}, "JoinRolesPicker")

const ContactPicker = reatomComponent(({ ctx }) => {
  const type = ctx.spy(joinState.contactType)
  const value = ctx.spy(joinState.contact)

  return (
    <div className="flex flex-col gap-2">
      <Typography className="text-sm font-semibold text-neutral-300">
        {translate["team.join.contact"]()}
      </Typography>
      <div className="flex flex-wrap items-center gap-2">
        {TEAM_CONTACTS.map((option) => (
          <Button
            key={option}
            type="button"
            background="default"
            className={clsx(
              "h-9 rounded-xl px-3 text-sm",
              type === option ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
            )}
            onClick={() => { joinState.contactType(ctx, option as TeamContactType); joinState.contact(ctx, "") }}
          >
            {option === "telegram" ? translate["team.join.contact-telegram"]() : translate["team.join.contact-email"]()}
          </Button>
        ))}
      </div>
      <Input
        type={type === "email" ? "email" : "text"}
        value={value}
        placeholder={type === "telegram" ? "@nickname" : "name@example.com"}
        maxLength={type === "email" ? 128 : 64}
        onChange={(event) => joinState.contact(ctx, event.target.value)}
      />
    </div>
  )
}, "JoinContactPicker")

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
  <div className="flex flex-col gap-2 rounded-2xl border border-green-800/40 bg-green-900/10 p-6">
    <Typography variant="title">{translate["team.join.success-title"]()}</Typography>
    <Typography className="text-neutral-300">{translate["team.join.success-text"]()}</Typography>
  </div>
)

export const JoinForm = reatomComponent(({ ctx }) => {
  const submitted = ctx.spy(joinState.submitted)
  const isProcessing = ctx.spy(joinState.isProcessing)

  if (submitted) return <JoinSuccess />

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-6">
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

      <ContactPicker />

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

      <div className="flex flex-wrap items-center gap-3">
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
