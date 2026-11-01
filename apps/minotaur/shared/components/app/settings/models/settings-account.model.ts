import { alertDialog } from "@/shared/components/config/alert-dialog/alert-dialog.model"
import { client } from "@/shared/lib/client-wrapper"
import { action, atom, reatomAsync, withAssign, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework"
import { settings, } from "./settings.model"
import { toast } from "sonner"
import { isError } from "@/shared/lib/utils"
import { passwordSchema } from "@/shared/schemas/auth"
import { translate } from "@/shared/locales/helpers"

/** The API answers with machine codes; the modal shows human texts. */
const getChangePasswordError = (message: string) => {
  switch (message) {
    case "PASSWORD_OR_LOGIN_INCORRECT":
      return translate["auth.shared.errors.password-or-login-incorrect"]()
    case "PASSWORD_IS_UNSAFE":
      return translate["auth.shared.errors.password-is-unsafe"]()
    case "NOT_FOUND":
      return translate["auth.shared.errors.not-exists"]()
    default:
      return message
  }
}

function firstIssueMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    try {
      const issues = JSON.parse(String((error as { message: unknown }).message))
      const message = Array.isArray(issues) ? issues[0]?.message : null

      if (typeof message === "string") return message
    } catch {
      // not a serialized zod error, fall through
    }
  }

  return translate["settings.account.invalid-password"]()
}

export const settingsAccountModel = () => {
  const deleteAccount = atom(null, "deleteAccount").pipe(
    withAssign((_, name) => ({
      before: action((ctx) => {
        alertDialog.open(ctx, {
          title: translate["settings.account.delete.title"](),
          confirmLabel: translate["settings.account.delete.confirm"](),
          description: translate["settings.account.delete.description"](),
          onConfirm: () => deleteAccount.submit(ctx),
        })
      }, `${name}.before`),
      submit: reatomAsync(async (ctx) => {
        return await client
          .delete<ExtractApiData<"deleteAccount">["data"]>("account/")
          .exec()
      }, {
        name: `${name}.submit`,
        onFulfill: (ctx, res) => {
          if (res === 'OK') {
            settings.close(ctx);
            ctx.schedule(() => window.location.reload())
          }
        },
        onReject: (_, e) => {
          if (isError(e)) {
            toast.error(getChangePasswordError(e.message))
          }
        }
      }).pipe(
        withStatusesAtom()
      )
    }))
  )

  const changePassState = atom(null, "changePassState").pipe(
    withAssign((_, name) => ({
      isOpen: atom(false, `${name}.isOpen`),
      currentPass: atom("", `${name}.currentPass`).pipe(withReset()),
      newPass: atom("", `${name}.newPass`).pipe(withReset()),
      newPassRepeat: atom("", `${name}.newPassRepeat`).pipe(withReset())
    }))
  )

  changePassState.isOpen.onChange((ctx, state) => {
    if (!state) {
      changePassState.currentPass.reset(ctx)
      changePassState.newPass.reset(ctx)
      changePassState.newPassRepeat.reset(ctx)
      changePass.submit.errorAtom.reset(ctx)
    }
  })

  const changePass = atom(null, "changePass").pipe(
    withAssign((_, name) => ({
      before: action((ctx) => {
        changePassState.isOpen(ctx, true)
      }, `${name}.before`),
      submit: reatomAsync(async (ctx, json: { currentPass: string, newPass: string }) => {
        changePass.submit.errorAtom.reset(ctx);

        return await client
          .patch<ExtractApiData<"patchAccountPassword">["data"]>("account/password", {
            json
          })
          .exec()
      }, {
        name: `${name}.submit`,
        onFulfill: (ctx, res) => {
          if (res === "OK") {
            changePassState.isOpen(ctx, false)
            toast.success(translate["settings.account.password-changed"]())
          }
        },
        onReject: (_, e) => {
          if (isError(e)) {
            toast.error(getChangePasswordError(e.message))
          }
        }
      }).pipe(
        withStatusesAtom(),
        withErrorAtom()
      ),
      handle: action((ctx, e: React.FormEvent) => {
        e.preventDefault()

        const currentPass = ctx.get(changePassState.currentPass);
        const newPass = ctx.get(changePassState.newPass);

        const json = {
          currentPass,
          newPass
        }

        const repeatPass = ctx.get(changePassState.newPassRepeat);

        const parsed = passwordSchema.safeParse(newPass)

        if (!parsed.success) {
          changePass.submit.errorAtom(ctx, new Error(firstIssueMessage(parsed.error)))
          return;
        }

        if (currentPass === newPass) {
          changePass.submit.errorAtom(ctx, new Error(translate["settings.account.password-differs"]()))
          return;
        }

        if (newPass !== repeatPass) {
          changePass.submit.errorAtom(ctx, new Error(translate["settings.account.passwords-mismatch"]()))
          return;
        }

        changePass.submit(ctx, json)
      }, `${name}.before`)
    }))
  )

  return {
    deleteAccount,
    changePass,
    changePassState
  }
}
