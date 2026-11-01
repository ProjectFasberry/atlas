import {
  action, atom, reatomAsync, spawn, withAssign, withDataAtom, withReset, withStatusesAtom,
  type AtomMut
} from "@reatom/framework";
import { registerSchema } from "@/shared/schemas/auth";
import { client } from "@/shared/lib/client-wrapper";
import { auth, type AuthFindoutType, authState, defineError } from "./auth.model";
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

export const registerState = atom(null, "registerState").pipe(
  withAssign((_, name) => ({
    type: atom<AuthRegisterType>("start-input", `${name}.type`).pipe(withReset()),
  }))
)
export const register = atom(null, "register").pipe(
  withAssign((_, name) => ({
    validators: {
      startInputValidate: atom((ctx): boolean =>
        fieldsOnlyRegisterSchema.safeParse({
          nickname: ctx.spy(authState.fields.nickname),
          password: ctx.spy(authState.fields.password),
          findout: ctx.spy(authState.fields.findout),
          findoutType: ctx.spy(authState.fields.findoutType),
          acceptRules: ctx.spy(authState.fields.acceptRules)
        }).success
      ),
      confirmValidate: atom((): boolean => false)
    },
    cb: {
      submitRegistration: reatomAsync(async (ctx): Promise<boolean> => {
        const nickname = ctx.get(authState.fields.nickname);
        const isExist = await getExistNickname(nickname)

        if (isExist) {
          authState.globalError(ctx, translate["auth.register.existing-player"]())
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

      const base = {
        nickname: ctx.get(authState.fields.nickname),
        password: ctx.get(authState.fields.password),
        findout: ctx.get(authState.fields.findout),
        findoutType: ctx.get(authState.fields.findoutType)
      }

      const { success, error, data } = registerSchema.safeParse(base);
      if (!success) throw error

      const res = await client
        .post<ExtractApiData<"postAuthRegister">["data"]>("auth/register", {
          searchParams: { token: token ?? "" },
          json: data
        })
        .exec()

      return res;
    }, {
      name: `${name}.submit`,
      onReject: (ctx, e) => {
        logError(e);

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
