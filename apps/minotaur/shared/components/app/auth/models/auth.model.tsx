import { action, atom } from "@reatom/framework";
import { reatomRecord, withAssign, withReset } from "@reatom/framework";
import { withSearchParamsPersist } from "@reatom/url";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import { isError } from "@/shared/lib/utils";
import { logger } from "@/shared/lib/logger";
import { pof } from "@/shared/components/config/cap/models/cap.model";
import { translate } from "@/shared/locales/helpers";
import * as z from "zod";

const AUTH_TYPE = ["register", "login"] as const;
export type AuthType = typeof AUTH_TYPE[number];
const AUTH_ERROR_TYPE = ["nickname", "password", "passwordRepeat", "findout", "acceptRules"] as const;
export type AuthErrorType = typeof AUTH_ERROR_TYPE[number];

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
        passwordRepeat: atom<string>("", `${name}.passwordRepeat`).pipe(withReset()),
        // Optional answer to "How did you hear about us?"
        findout: atom<Maybe<string>>(undefined, `${name}.findout`).pipe(withReset()),
        // Hidden: a link with ?referrer= keeps the attribution type.
        findoutType: atom<"custom" | "referrer">("custom", `${name}.findoutType`).pipe(withReset()),
        acceptRules: atom(false, `${name}.acceptRules`).pipe(withReset())
      }))
    ),
    settings: atom(null, `${name}.settings`).pipe(
      withAssign((_, name) => ({
        showPassword: atom(false, `${name}.showPassword`).pipe(withReset()),
        showPasswordRepeat: atom(false, `${name}.showPasswordRepeat`).pipe(withReset())
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
      authState.fields.passwordRepeat.reset(ctx);
      authState.fields.findout.reset(ctx);
      authState.fields.findoutType.reset(ctx);
      authState.fields.acceptRules.reset(ctx);
      authState.globalError.reset(ctx);
      authState.errorsType.reset(ctx);
      authState.isProcessing.reset(ctx)
      authState.token.reset(ctx)
      authState.settings.showPassword.reset(ctx)
      authState.settings.showPasswordRepeat.reset(ctx)

      pof.resetAll(ctx)
    }),
    defineCap: action((ctx) => {
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
            logger.error("CAP error", e)
            authState.globalError(ctx, translate["auth.shared.errors.captcha"]());
          }
        },
      })
      pof.isOpen(ctx, true);
    })
  })),
);

export const isPofActiveAtom = atom((ctx) =>
  maybeSpyOptionAtom(ctx, "flags", "isPof", true) ? ctx.spy(pof.isOpen) : false,
);
export const authIsDisabledAtom = atom((ctx) => ctx.spy(isPofActiveAtom) || ctx.spy(authState.isProcessing));

type AuthErrorInfo = {
  message: () => string
  fields: AuthErrorType[]
}

const getAuthErrors = (): Record<string, AuthErrorInfo> => ({
  "AUTHORIZATION_DISABLED": {
    message: () => translate["auth.shared.errors.authorization-disabled"](),
    fields: [],
  },
  "IP_RESTRICTIONS": {
    message: () => translate["auth.shared.errors.ip-restricted"](),
    fields: [],
  },
  "NOT_EXISTS": {
    message: () => translate["auth.shared.errors.not-exists"](),
    fields: [],
  },
  "PASSWORD_OR_LOGIN_INCORRECT": {
    message: () => translate["auth.shared.errors.password-or-login-incorrect"](),
    fields: ["nickname", "password"],
  },
  "PASSWORD_IS_UNSAFE": {
    message: () => translate["auth.shared.errors.password-is-unsafe"](),
    fields: [],
  },
  "USER_EXISTS": {
    message: () => translate["auth.shared.errors.user-exists"](),
    fields: [],
  },
  "TOKEN_NOT_FOUND": {
    message: () => translate["auth.shared.errors.token-not-found"](),
    fields: [],
  },
  "TOKEN_IS_NOT_PROVIDED": {
    message: () => translate["auth.shared.errors.token-not-found"](),
    fields: [],
  },
  "CAP_UNAVAILABLE": {
    message: () => translate["auth.shared.errors.captcha"](),
    fields: [],
  },
});

export const defineError = action((ctx, e: Error | unknown) => {
  if (!isError(e)) return;

  const error = getAuthErrors()[e.message];

  if (!error) {
    logger.error("Unknown error", e.message)
    authState.globalError(ctx, translate["auth.shared.errors.unknown"]());
    return;
  }

  authState.globalError(ctx, error.message());

  if (error.fields.length) {
    authState.errorsType(ctx, (state) => [...new Set([...state, ...error.fields])]);
  }
}, "defineError")

/** Show the first Zod issue in the shared error block and mark its field. */
export const applyZodError = action((ctx, error: z.ZodError) => {
  const issue = error.issues[0];
  const property = issue?.path[0]?.toString() as AuthErrorType | undefined;

  authState.globalError(ctx, issue?.message ?? translate["auth.shared.errors.unknown"]());

  if (property && AUTH_ERROR_TYPE.includes(property)) {
    authState.errorsType(ctx, (state) => state.includes(property) ? state : [...state, property]);
  }
}, "applyZodError")
