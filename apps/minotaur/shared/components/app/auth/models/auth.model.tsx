import { action, atom, type Action } from "@reatom/framework";
import { reatomRecord, withAssign, withReset } from "@reatom/framework";
import { withSearchParamsPersist } from "@reatom/url";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import { isError } from "@/shared/lib/utils";
import { logger } from "@/shared/lib/logger";
import { pof } from "@/shared/components/config/cap/models/cap.model";
import { translate } from "@/shared/locales/helpers";

const AUTH_TYPE = ["register", "login"] as const;
export type AuthType = typeof AUTH_TYPE[number];
const AUTH_ERROR_TYPE = ["nickname", "password", "findout"] as const;
export type AuthErrorType = typeof AUTH_ERROR_TYPE[number];
const AUTH_FINDOUT_TYPE = ["referrer", "custom"] as const;
export type AuthFindoutType = typeof AUTH_FINDOUT_TYPE[number];

export const authState = atom(null, "authState").pipe(
  withAssign((_, name) => ({
    type: atom<AuthType>("login", `${name}.type`).pipe(
      withSearchParamsPersist("type", (type = "login") => type),
    ),
    searchParams: reatomRecord<Record<string, string>>({}, `${name}.searchParams`),
    fields: atom(null, `_${name}.fields`).pipe(
      withAssign((_, name) => ({
        nickname: atom<string>("", `${name}.nickname`).pipe(withReset()),
        password: atom<string>("", `${name}.password`).pipe(withReset()),
        // Must be refererr nickname or other findout info
        findout: atom<Maybe<string>>(undefined, `${name}.findout`).pipe(withReset()),
        findoutType: atom<AuthFindoutType | null>(null, `${name}.findoutType`).pipe(withReset()),
        acceptRules: atom(false, `${name}.acceptRules`).pipe(withReset())
      }))
    ),
    settings: atom(null, `${name}.settings`).pipe(
      withAssign((_, name) => ({
        showPassword: atom(false, `${name}.showPassword`).pipe(withReset())
      }))
    ),
    globalError: atom<Nullable<string>>(null, `${name}.globalError`).pipe(withReset()),
    errorsType: atom<AuthErrorType[]>([], `${name}.errorsType`).pipe(withReset()),
    isProcessing: atom(false, `${name}.isProcessing`).pipe(withReset()),
    token: atom<Nullable<string>>(null, `${name}.token`).pipe(withReset()),
  }))
)

authState.searchParams.onChange((ctx, state) => {
  const isReferrer = "referrer" in state;

  if (isReferrer) {
    authState.fields.findout(ctx, state.referrer);
    authState.fields.findoutType(ctx, "referrer");
  }
});

authState.type.onChange((ctx) => auth.resetErrors(ctx));

export const auth = atom(null, "auth").pipe(
  withAssign(() => ({
    resetErrors: action((ctx) => {
      authState.globalError.reset(ctx);
      authState.errorsType.reset(ctx);
    }),
    resetError: action((ctx) => {
      const errors = ctx.get(authState.errorsType);

      for (const target of errors) {
        authState.errorsType(ctx, (state) => state.filter((error) => error !== target));
      }
    }),
    resetAuthState: action((ctx) => {
      authState.fields.nickname.reset(ctx);
      authState.fields.password.reset(ctx);
      authState.fields.findout.reset(ctx);
      authState.fields.findoutType.reset(ctx);
      authState.fields.acceptRules.reset(ctx);
      authState.globalError.reset(ctx);
      authState.errorsType.reset(ctx);
      authState.isProcessing.reset(ctx)
      authState.settings.showPassword.reset(ctx)

      pof.resetAll(ctx)
    }),
    defineCap: action((ctx) => {
      pof.isOpen(ctx, true);

      pof.data(ctx, {
        cb: {
          onSolve: (token) => {
            pof.isOpen(ctx, false);
            authState.token(ctx, token);
            authState.isProcessing(ctx, false);
          },
          onError: (e) => {
            pof.isOpen(ctx, false);
            authState.isProcessing(ctx, false);

            if (typeof e === 'string') {
              authState.globalError(ctx, e);
            } else if (e instanceof Error) {
              authState.globalError(ctx, e.message);
            } else {
              authState.globalError(ctx, "Captcha error");
            }
          }
        },
      })
    })
  })),
);

export const isPofActiveAtom = atom((ctx) =>
  maybeSpyOptionAtom(ctx, "flags", "isPof", true) ? ctx.spy(pof.isOpen) : false,
);
export const authIsDisabledAtom = atom((ctx) => ctx.spy(isPofActiveAtom) || ctx.spy(authState.isProcessing));

type ScopeName = "auth" | "global" | "captcha"

type AuthErrorsUnionEnum =
  | ExtractApiErr<"postAuthLoginBasic", 400>
  | ExtractApiErr<"postAuthRegister", 400>
  | "TOKEN_NOT_FOUND";

const createAuthErrors = (): Record<ScopeName, Partial<Record<AuthErrorsUnionEnum, string>>> => ({
  auth: {
    "AUTHORIZATION_DISABLED": translate["auth.shared.errors.authorization-disabled"](),
    "IP_RESTRICTIONS": translate["auth.shared.errors.ip-restricted"](),
    "NOT_EXISTS": translate["auth.shared.errors.not-exists"](),
    "PASSWORD_OR_LOGIN_INCORRECT": translate["auth.shared.errors.password-or-login-incorrect"](),
    "PASSWORD_IS_UNSAFE": translate["auth.shared.errors.password-is-unsafe"](),
  },
  global: {
    "USER_EXISTS": translate["auth.shared.errors.user-exists"](),
  },
  captcha: {
    "TOKEN_NOT_FOUND": translate["auth.shared.errors.token-not-found"](),
  },
});

const AUTH_ERRORS = createAuthErrors();

const SCOPE_ACTIONS: Record<ScopeName, Action<[], void>> = {
  auth: action((ctx) => {
    authState.errorsType(ctx, (state) => [...state, "password"]);
    authState.errorsType(ctx, (state) => [...state, "nickname"]);
  }),
  global: action(() => { }),
  captcha: action((ctx) => {

  })
};

export const defineError = action((ctx, e: Error | unknown): ScopeName | null => {
  if (!isError(e)) return null;

  type ErrorKey = { [S in ScopeName]: keyof (typeof AUTH_ERRORS)[S] }[ScopeName];

  function getError(key: ErrorKey): { scope: ScopeName; message: string } | null {
    for (const [name, errors] of Object.entries(AUTH_ERRORS)) {
      if (key in errors) {
        return { scope: name as ScopeName, message: (errors as Record<string, string>)[key] };
      }
    }
    return null;
  }

  const error = getError(e.message as ErrorKey);

  if (!error) {
    logger.error("Unknown error", e.message)
    authState.globalError(ctx, e.message);
    return null;
  }

  const { scope, message } = error;

  authState.globalError(ctx, message);
  SCOPE_ACTIONS?.[scope](ctx)

  return scope
}, "defineError")
