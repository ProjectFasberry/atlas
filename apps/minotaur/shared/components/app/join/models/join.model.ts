import { action, atom, withAssign, withReset } from "@reatom/framework"
import { client } from "@/shared/lib/client-wrapper"
import { pof } from "@/shared/components/config/cap/models/cap.model"
import { maybeSpyOptionAtom } from "@/shared/models/app/utils"
import { teamApplySchema, type TeamContactType, type TeamRole } from "@/shared/schemas/team"

export const joinState = atom(null, "joinState").pipe(
  withAssign((_, name) => ({
    roles: atom<TeamRole[]>([], `${name}.roles`).pipe(withReset()),
    about: atom("", `${name}.about`).pipe(withReset()),
    contactType: atom<TeamContactType>("telegram", `${name}.contactType`).pipe(withReset()),
    contact: atom("", `${name}.contact`).pipe(withReset()),
    portfolio: atom("", `${name}.portfolio`).pipe(withReset()),
    token: atom<string | null>(null, `${name}.token`).pipe(withReset()),
    error: atom<string | null>(null, `${name}.error`),
    submitted: atom(false, `${name}.submitted`),
    isProcessing: atom(false, `${name}.isProcessing`),
  }))
)

export const toggleJoinRole = action((ctx, role: TeamRole) => {
  joinState.roles(ctx, (roles) =>
    roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]
  )
}, "toggleJoinRole")

const openCap = (ctx: Parameters<typeof toggleJoinRole>[0]) => {
  joinState.isProcessing(ctx, true)
  pof.isOpen(ctx, true)
  pof.data(ctx, {
    cb: {
      onSolve: (token) => {
        pof.isOpen(ctx, false)
        joinState.token(ctx, token)
        joinState.isProcessing(ctx, false)
        submitJoin(ctx)
      },
      onError: () => {
        pof.isOpen(ctx, false)
        joinState.isProcessing(ctx, false)
        joinState.error(ctx, "CAP_FAILED")
      },
    },
  })
}

export const submitJoin = action((ctx) => {
  joinState.error(ctx, null)

  const parsed = teamApplySchema.safeParse({
    roles: ctx.get(joinState.roles),
    about: ctx.get(joinState.about),
    contact: { type: ctx.get(joinState.contactType), value: ctx.get(joinState.contact) },
    portfolio: ctx.get(joinState.portfolio),
  })

  if (!parsed.success) {
    joinState.error(ctx, parsed.error.issues[0]?.message ?? "INVALID_FORM")
    return
  }

  const pofActive = maybeSpyOptionAtom(ctx, "flags", "isPof", true)
  const token = ctx.get(joinState.token)

  if (pofActive && !token) {
    openCap(ctx)
    return
  }

  // CAP tokens are single use.
  joinState.token(ctx, null)
  joinState.isProcessing(ctx, true)

  // The contact-fields shape is deployed on a rolling update; send the legacy
  // field as well so the form works on both API versions. Remove after rollout.
  const legacy = parsed.data.contact.type === "telegram"
    ? { telegram: parsed.data.contact.value }
    : { email: parsed.data.contact.value }

  void client.raw.post<{ id: number }>("/team/apply", {
    json: { ...parsed.data, ...legacy },
    headers: { "x-cap-token": token ?? "" },
  }).then(() => {
    joinState.submitted(ctx, true)
    joinState.roles.reset(ctx)
    joinState.about.reset(ctx)
    joinState.contactType.reset(ctx)
    joinState.contact.reset(ctx)
    joinState.portfolio.reset(ctx)
  }).catch((error: unknown) => {
    joinState.error(ctx, error instanceof Error ? error.message : String(error))
  }).finally(() => {
    joinState.isProcessing(ctx, false)
  })
}, "submitJoin")
