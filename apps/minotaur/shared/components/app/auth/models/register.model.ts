import {
  action, atom, reatomAsync, withAssign, withReset, withStatusesAtom
} from "@reatom/framework";
import { registerSchema } from "@/shared/schemas/auth";
import { client } from "@/shared/lib/client-wrapper";
import { auth, applyZodError, authState, defineError } from "./auth.model";
import { logError } from "@/shared/lib/log";
import { getExistNickname } from "@/shared/models/shared.model";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import { translate } from "@/shared/locales/helpers";
import * as z from "zod";

const fieldsOnlyRegisterSchema = z.intersection(
  registerSchema,
  z.object({
    acceptRules: z.literal(true, {
      error: () => translate["auth.validation.rules-required"]()
    })
  })
)

const findoutAnswer = (value: Maybe<string>) => value?.trim() || "-"

export const registerState = atom(null, "registerState").pipe(
  withAssign((_, name) => ({
    success: atom(false, `${name}.success`).pipe(withReset()),
  }))
)

export const register = atom(null, "register").pipe(
  withAssign((_, name) => ({
    submit: reatomAsync(async (ctx) => {
      auth.resetErrors(ctx)

      const nickname = ctx.get(authState.fields.nickname)
      const password = ctx.get(authState.fields.password)

      if (password !== ctx.get(authState.fields.passwordRepeat)) {
        authState.globalError(ctx, translate["auth.register.password-mismatch"]())
        authState.errorsType(ctx, (state) => state.includes("passwordRepeat") ? state : [...state, "passwordRepeat"])
        return false
      }

      const parsed = fieldsOnlyRegisterSchema.safeParse({
        nickname,
        password,
        findout: findoutAnswer(ctx.get(authState.fields.findout)),
        findoutType: ctx.get(authState.fields.findoutType),
        acceptRules: ctx.get(authState.fields.acceptRules)
      })

      if (!parsed.success) {
        applyZodError(ctx, parsed.error)
        return false
      }

      try {
        const isExist = await getExistNickname(nickname)

        if (isExist) {
          authState.globalError(ctx, translate["auth.register.existing-player"]())
          return false
        }
      } catch (e) {
        logError(e);
        authState.globalError(ctx, translate["auth.shared.errors.unknown"]())
        return false
      }

      const pofIsActive = maybeSpyOptionAtom(ctx, "flags", "isPof", true)
      const token = ctx.get(authState.token);

      if (pofIsActive && !token) {
        authState.isProcessing(ctx, true);
        auth.defineCap(ctx)
        return false;
      }

      // CAP tokens are single use.
      if (token) authState.token.reset(ctx);

      authState.isProcessing(ctx, true);

      const payload = {
        nickname: parsed.data.nickname,
        password: parsed.data.password,
        findout: parsed.data.findout,
        findoutType: parsed.data.findoutType,
      }

      await client
        .raw.post<ExtractApiData<"postAuthRegister">["data"]>("/auth/register", {
          params: { query: { token: token ?? "" } },
          json: payload
        })

      authState.isProcessing(ctx, false);
      registerState.success(ctx, true);
      return true
    }, {
      name: `${name}.submit`,
      onReject: (ctx, e) => {
        logError(e);
        authState.isProcessing(ctx, false);

        if (e instanceof z.ZodError) {
          applyZodError(ctx, e)
          return
        }

        defineError(ctx, e)
      }
    }).pipe(
      withStatusesAtom()
    ),
    resetRegisterState: action((ctx) => {
      registerState.success.reset(ctx);
    }),
    toLogin: action((ctx) => {
      authState.type(ctx, "login")
      auth.resetAuthState(ctx)
      register.resetRegisterState(ctx)
      authState.token.reset(ctx);
    })
  }))
)
