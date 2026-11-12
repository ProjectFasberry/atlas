import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/config/link/link"
import { clsx } from "cnfast"
import { translate } from "@/shared/locales/helpers"
import { TEAM_CONTACTS, TEAM_ROLES, type TeamContactType, type TeamRole } from "@/shared/schemas/team"
import { clearJoinError, joinState, submitJoin, toggleJoinRole } from "../models/join.model"

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

const JOIN_ERROR_MESSAGES: Record<string, () => string> = {
  ROLES_REQUIRED: () => translate["team.join.errors.roles-required"](),
  ABOUT_TOO_SHORT: () => translate["team.join.errors.about-too-short"](),
  ABOUT_TOO_LONG: () => translate["team.join.errors.about-too-long"](),
  TELEGRAM_REQUIRED: () => translate["team.join.errors.telegram-required"](),
  TELEGRAM_TOO_LONG: () => translate["team.join.errors.telegram-too-long"](),
  EMAIL_INVALID: () => translate["team.join.errors.email-invalid"](),
  EMAIL_TOO_LONG: () => translate["team.join.errors.email-too-long"](),
  PORTFOLIO_TOO_LONG: () => translate["team.join.errors.portfolio-too-long"](),
  CAP_FAILED: () => translate["team.join.errors.cap-failed"](),
  RATE_LIMITED: () => translate["team.join.errors.rate-limited"](),
}

const getJoinError = (error: string) =>
  JOIN_ERROR_MESSAGES[error]?.() ?? translate["team.join.errors.generic"]()

const fieldClass = `
  w-full min-h-28 rounded-xl border border-neutral-800 bg-neutral-900 p-3
  text-sm text-neutral-50 outline-none duration-150 focus:border-neutral-600
`

const invalidFieldClass = "border-red ring-1 ring-red/30"

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
            aria-pressed={active}
            onClick={() => toggleJoinRole(ctx, role)}
            data-state={active ? "selected" : "default"}
            className={clsx(
              "relative flex flex-col gap-1 rounded-xl border p-3 text-left duration-150",
              active
                ? "border-green-600/60 bg-green-500/10"
                : "border-neutral-800 bg-neutral-900 hover:border-neutral-700",
            )}
          >
            <Typography className="text-sm font-semibold pr-5">
              {/* @ts-expect-error paraglide keys are generated from messages */}
              {translate[ROLE_TITLE[role]]()}
            </Typography>
            <Typography className="text-xs text-neutral-500">
              {/* @ts-expect-error paraglide keys are generated from messages */}
              {translate[ROLE_DESCRIPTION[role]]()}
            </Typography>
            {active && (
              <span className="absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full bg-green-500 text-neutral-950">
                <Icon name="sprite:check" className="size-3" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}, "JoinRolesPicker")

const ContactPicker = reatomComponent(({ ctx }) => {
  const type = ctx.spy(joinState.contactType)
  const value = ctx.spy(joinState.contact)
  const error = ctx.spy(joinState.error)
  const invalid = error === "TELEGRAM_REQUIRED" || error === "TELEGRAM_TOO_LONG"
    || error === "EMAIL_INVALID" || error === "EMAIL_TOO_LONG"

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="join-contact" className="text-sm font-semibold text-neutral-300">
        {translate["team.join.contact"]()}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {TEAM_CONTACTS.map((option) => (
          <Button
            key={option}
            type="button"
            background="default"
            aria-pressed={type === option}
            className={clsx(
              "h-9 rounded-xl px-3 text-sm",
              type === option ? "bg-neutral-50! text-neutral-950!" : "bg-neutral-800",
            )}
            onClick={() => {
              joinState.contactType(ctx, option as TeamContactType)
              joinState.contact(ctx, "")
              clearJoinError(ctx)
            }}
          >
            {option === "telegram" ? translate["team.join.contact-telegram"]() : translate["team.join.contact-email"]()}
          </Button>
        ))}
      </div>
      <Input
        id="join-contact"
        type={type === "email" ? "email" : "text"}
        value={value}
        variant={invalid ? "danger" : "default"}
        aria-invalid={invalid}
        aria-describedby={error ? "join-error" : undefined}
        placeholder={type === "telegram"
          ? translate["team.join.contact-telegram-placeholder"]()
          : translate["team.join.contact-email-placeholder"]()}
        maxLength={type === "email" ? 128 : 64}
        onClick={() => clearJoinError(ctx)}
        onChange={(event) => {
          clearJoinError(ctx)
          joinState.contact(ctx, event.target.value)
        }}
      />
    </div>
  )
}, "JoinContactPicker")

const CharCounter = ({ value, max }: { value: string, max: number }) => (
  <span className="self-end text-[11px] tabular-nums text-neutral-500">
    {value.length}/{max}
  </span>
)

const JoinError = reatomComponent(({ ctx }) => {
  const error = ctx.spy(joinState.error)
  if (!error) return null

  return (
    <div
      id="join-error"
      role="alert"
      aria-live="assertive"
      className="rounded-lg bg-red/80 px-3 py-2 text-sm font-semibold"
    >
      {getJoinError(error)}
    </div>
  )
}, "JoinError")

const JoinSuccess = () => (
  <div className="flex flex-col gap-4 rounded-2xl border border-green-800/40 bg-green-900/10 p-6">
    <div className="flex flex-col gap-2">
      <Icon name="sprite:check" className="size-7 text-green-400" />
      <Typography variant="title">{translate["team.join.success-title"]()}</Typography>
      <Typography className="text-neutral-300">{translate["team.join.success-text"]()}</Typography>
    </div>
    <Link
      href="/"
      className="w-fit rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold duration-150 hover:bg-green-500"
    >
      {translate["team.join.back-home"]()}
    </Link>
  </div>
)

export const JoinForm = reatomComponent(({ ctx }) => {
  const submitted = ctx.spy(joinState.submitted)
  const isProcessing = ctx.spy(joinState.isProcessing)
  const error = ctx.spy(joinState.error)
  const about = ctx.spy(joinState.about)
  const portfolio = ctx.spy(joinState.portfolio)

  if (submitted) return <JoinSuccess />

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 sm:p-6">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-neutral-300">
          {translate["team.join.roles"]()}
        </legend>
        <RolesPicker />
      </fieldset>

      <div className="flex flex-col gap-1">
        <label htmlFor="join-about" className="text-sm font-semibold text-neutral-300">
          {translate["team.join.about"]()}
        </label>
        <textarea
          id="join-about"
          className={clsx(fieldClass, error?.startsWith("ABOUT_") && invalidFieldClass)}
          value={about}
          aria-invalid={error?.startsWith("ABOUT_")}
          aria-describedby={error ? "join-error" : undefined}
          placeholder={translate["team.join.about-placeholder"]()}
          maxLength={2000}
          onClick={() => clearJoinError(ctx)}
          onInput={(event) => {
            clearJoinError(ctx)
            joinState.about(ctx, event.currentTarget.value)
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-neutral-500">{translate["team.join.about-hint"]()}</span>
          <CharCounter value={about} max={2000} />
        </div>
      </div>

      <ContactPicker />

      <div className="flex flex-col gap-1">
        <label htmlFor="join-portfolio" className="text-sm font-semibold text-neutral-300">
          {translate["team.join.portfolio"]()}
        </label>
        <textarea
          id="join-portfolio"
          className={clsx(fieldClass, error === "PORTFOLIO_TOO_LONG" && invalidFieldClass)}
          value={portfolio}
          aria-invalid={error === "PORTFOLIO_TOO_LONG"}
          aria-describedby={error ? "join-error" : undefined}
          placeholder={translate["team.join.portfolio-placeholder"]()}
          maxLength={2000}
          onClick={() => clearJoinError(ctx)}
          onInput={(event) => {
            clearJoinError(ctx)
            joinState.portfolio(ctx, event.currentTarget.value)
          }}
        />
        <CharCounter value={portfolio} max={2000} />
      </div>

      <JoinError />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          background="positive"
          className="h-11 px-5 font-semibold"
          disabled={isProcessing}
          withSpinner
          isLoading={isProcessing}
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
