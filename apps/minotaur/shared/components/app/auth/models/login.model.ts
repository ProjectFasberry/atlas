import { client } from "@/shared/lib/client-wrapper";
import { atom, type Ctx } from "@reatom/framework";
import { reatomAsync, spawn, withAssign, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { applyZodError, auth, authState, defineError, isPofActiveAtom } from "./auth.model";
import { qrLogin } from "./qr.model";
import { pageState } from "@/shared/models/page-context.model";
import { getNextPath, goAfterAuth } from "@/shared/lib/auth-redirect";
import { logError } from "@/shared/lib/log";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";
import * as z from "zod";
import { authSchema as loginSchema } from "@/shared/schemas/auth";

export type AuthLoginVariant = "qr" | "password";

const LOGIN_VARIANTS_EVENTS: Partial<Record<AuthLoginVariant, (ctx: Ctx) => void>> = {
  qr: (ctx) => qrLogin.generate(ctx),
};

export const login = atom(null, "login").pipe(
  withAssign((_, name) => ({
    basic: atom(null, `${name}.basic`).pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx) => {
          auth.resetErrors(ctx);

          const { success, error, data: json } = loginSchema.safeParse({
            nickname: ctx.get(authState.fields.nickname),
            password: ctx.get(authState.fields.password),
          });

          // Do not ask for a CAPTCHA until the fields themselves are valid.
          if (!success) return error;

          const pofIsActive = maybeSpyOptionAtom(ctx, "flags", "isPof", true)
          const token = ctx.get(authState.token);

          // If POF is active and no token, show the captcha for generating a token
          if (pofIsActive && !token) {
            authState.isProcessing(ctx, true);
            auth.defineCap(ctx)
            return;
          }

          // CAP tokens are single use: drop it right away, so the next attempt
          // asks for a new one instead of sending a burned token.
          if (token) authState.token.reset(ctx);

          authState.isProcessing(ctx, true);

          return await client.raw
            .post<ExtractApiData<"postAuthLoginBasic">["data"]>(`/auth/login/basic`, {
              params: { query: { token: token ?? "" } },
              json,
              timeout: 10000,
            })
        }, {
          name: `${name}.submit`,
          onFulfill: (ctx, res) => {
            if (!res) return;

            if (res instanceof z.ZodError) {
              applyZodError(ctx, res);
              authState.isProcessing(ctx, false);

              return;
            }

            goAfterAuth(getNextPath(ctx.get(pageState.urlParsed)?.search))
          },
          onReject: (ctx, e) => {
            logError(e);
            authState.isProcessing(ctx, false);

            defineError(ctx, e)
          }
        }).pipe(
          withErrorAtom(),
          withStatusesAtom()
        )
      }))
    ),
  })),
);

export const authLoginVariantAtom = atom<AuthLoginVariant>("password", "authLoginVariant").pipe(
  withAssign((target) => ({
    select: reatomAsync(async (ctx, variant: AuthLoginVariant) => {
      target(ctx, variant);
      LOGIN_VARIANTS_EVENTS[variant]?.(ctx);
    }),
    filterVariants: <T extends { value: AuthLoginVariant }>(variants: T[]) =>
      atom((ctx) => variants.filter((d) => d.value !== ctx.spy(target))),
  })),
);

authLoginVariantAtom.onChange((ctx, state) => {
  if (state !== "qr") qrLogin.close(ctx)
});

authState.type.onChange((ctx, state) => {
  if (state !== "login") {
    qrLogin.close(ctx)
    return;
  }

  if (ctx.get(authLoginVariantAtom) === "qr") {
    qrLogin.generate(ctx);
  }
});

/**
 * The form stays enabled on purpose: validation runs on submit and shows the
 * reason. Only a request in flight, the CAP dialog or a CAP check may block it.
 */
export const authSubmitIsDisabledAtom = atom((ctx) => {
  const isPending = ctx.spy(login.basic.submit.statusesAtom).isPending;
  const isProcessing = ctx.spy(authState.isProcessing);
  const isPofActive = ctx.spy(isPofActiveAtom)
  return isPofActive || isPending || isProcessing;
}, "authSubmitIsDisabled");
