import {
  action, atom, reatomAsync, spawn, withAssign, withDataAtom, withReset, withStatusesAtom,
  type AtomMut
} from "@reatom/framework";
import { registerSchema } from "@/shared/schemas/auth";
import { client } from "@/shared/lib/client-wrapper";
import { auth, applyZodError, type AuthFindoutType, authState, defineError } from "./auth.model";
import { logError } from "@/shared/lib/log";
import { createNavigationModel } from "./navigation.model";
import { getExistNickname } from "@/shared/models/shared.model";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import { translate } from "@/shared/locales/helpers";
import * as z from "zod";

export const AUTH_REGISTER_TYPE = [
  "start-input",
  "confirm",
] as const;
export type AuthRegisterType = typeof AUTH_REGISTER_TYPE[number];

const fieldsOnlyRegisterSchema = z.intersection(
  registerSchema,
  z.object({ acceptRules: z.literal(true) })
)

/** The findout question is optional for the player: an empty answer is stored as a dash. */
const normalizeFindout = (findout: Maybe<string>, findoutType: AuthFindoutType | null) => {
  const answer = findout?.trim() || "-"
  const type = answer === "-" ? "custom" : (findoutType ?? "custom")

  return { findout: answer, findoutType: type }
}

export const registerState = atom(null, "registerState").pipe(
  withAssign((_, name) => ({
    type: atom<AuthRegisterType>("start-input", `${name}.type`).pipe(withReset()),
  }))
)
export const register = atom(null, "register").pipe(
  withAssign((_, name) => ({
    validators: {
      startInputValidate: atom((ctx): boolean => {
        if (ctx.spy(authState.fields.password) !== ctx.spy(authState.fields.passwordRepeat)) {
          return false
        }

        const { findout, findoutType } = normalizeFindout(
          ctx.spy(authState.fields.findout),
          ctx.spy(authState.fields.findoutType),
        )

        return fieldsOnlyRegisterSchema.safeParse({
          nickname: ctx.spy(authState.fields.nickname),
          password: ctx.spy(authState.fields.password),
          findout,
          findoutType,
          acceptRules: ctx.spy(authState.fields.acceptRules)
        }).success
      }),
      confirmValidate: atom((): boolean => false)
    },
    cb: {
      submitRegistration: reatomAsync(async (ctx): Promise<boolean> => {
        const nickname = ctx.get(authState.fields.nickname);

        try {
          const isExist = await getExistNickname(nickname)

          if (isExist) {
            authState.globalError(ctx, translate["auth.register.existing-player"]())
            return false;
          }
        } catch (e) {
          logError(e);
          authState.globalError(ctx, translate["auth.shared.errors.unknown"]())
          return false;
        }

        authState.globalError.reset(ctx);

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
        register.submit(ctx, token);

        return true
      }, `${name}.submitRegistration`).pipe(
        withStatusesAtom()
      )
    },
    submit: reatomAsync(async (ctx, token: string | null) => {
      authState.globalError.reset(ctx)

      const { findout, findoutType } = normalizeFindout(
        ctx.get(authState.fields.findout),
        ctx.get(authState.fields.findoutType),
      )

      const base = {
        nickname: ctx.get(authState.fields.nickname),
        password: ctx.get(authState.fields.password),
        findout,
        findoutType
      }

      const { success, error, data } = registerSchema.safeParse(base);
      if (!success) throw error

      const res = await client
        .raw.post<ExtractApiData<"postAuthRegister">["data"]>("/auth/register", {
          params: { query: { token: token ?? "" } },
          json: data
        })

      return res;
    }, {
      name: `${name}.submit`,
      onReject: (ctx, e) => {
        logError(e);

        if (e instanceof z.ZodError) {
          applyZodError(ctx, e)
          return
        }

        defineError(ctx, e)
      },
      onSettle: (ctx) => {
        authState.isProcessing(ctx, false);
      }
    }).pipe(
      withStatusesAtom(),
      withDataAtom()
    ),
    resetRegisterState: action((ctx) => {
      registerState.type.reset(ctx);
    }),
    toLogin: action((ctx) => {
      authState.type(ctx, "login")
      auth.resetAuthState(ctx)
      register.resetRegisterState(ctx)
      authState.token.reset(ctx);
    }),
    next: action((ctx) => {
      auth.resetErrors(ctx)

      if (ctx.get(registerState.type) === "start-input") {
        if (ctx.get(authState.fields.password) !== ctx.get(authState.fields.passwordRepeat)) {
          authState.globalError(ctx, translate["auth.register.password-mismatch"]())
          authState.errorsType(ctx, (state) => [...state, "passwordRepeat"])
          return
        }

        const { findout, findoutType } = normalizeFindout(
          ctx.get(authState.fields.findout),
          ctx.get(authState.fields.findoutType),
        )

        const parsed = fieldsOnlyRegisterSchema.safeParse({
          nickname: ctx.get(authState.fields.nickname),
          password: ctx.get(authState.fields.password),
          findout,
          findoutType,
          acceptRules: ctx.get(authState.fields.acceptRules)
        })

        if (!parsed.success) {
          applyZodError(ctx, parsed.error)
          return
        }
      }

      spawn(ctx, (spawnCtx) => {
        registerNavigationModel.next(spawnCtx)
      })
    })
  }))
)

export const registerNavigationModel = createNavigationModel({
  steps: [
    {
      id: "start-input",
      validators: {
        toNext: register.validators.startInputValidate
      },
      cb: register.cb.submitRegistration
    },
    {
      id: "confirm",
      validators: {
        toBack: false
      }
    }
  ],
  typeAtom: registerState.type as AtomMut<string>
})

export const createFindoutOptions = (): { title: string, value: AuthFindoutType }[] => ([
  { title: translate["auth.register.findout.referrer"](), value: "referrer" },
  { title: translate["auth.register.findout.custom"](), value: "custom" },
])

export const findoutSelectedTypeAtom = atom((ctx) =>
  createFindoutOptions().find((d) => d.value === ctx.spy(authState.fields.findoutType)) ?? null,
);
