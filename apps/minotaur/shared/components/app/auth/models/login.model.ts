import { client } from "@/shared/lib/client-wrapper";
import { invariant } from "@/shared/lib/utils";
import { atom, action } from "@reatom/framework";
import { type AsyncCtx, reatomAsync, spawn, withAssign, withDataAtom, withErrorAtom, withReset, withStatusesAtom } from "@reatom/framework";
import { onEvent } from "@reatom/web";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { auth, type AuthErrorType, authState, defineError, isPofActiveAtom } from "./auth.model";
import { createWsUrl } from "@/shared/lib/helpers";
import { getApiHost } from "@/shared/lib/helpers";
import { env } from "@/shared/env";
import { logError } from "@/shared/lib/log";
import * as z from "zod";
import { authSchema as loginSchema } from "@/shared/schemas/auth";
import { maybeSpyOptionAtom } from "@/shared/models/app/utils";

export type QREventsEvent =
  | "expired"
  | "verified"
  | "connected" // ws only event
  | "declined";

export type QREventsPayload = {
  event: QREventsEvent;
};

export type AuthLoginVariant = "qr" | "game" | "password";
export type AuthLoginQRStatus = QREventsEvent | "idle"

const LOGIN_VARIANTS_EVENTS: Partial<Record<AuthLoginVariant, (ctx: AsyncCtx) => void>> = {
  qr: (ctx) => login.qr.generate(ctx),
  game: (ctx) => login.game.generate(ctx),
};

export const loginState = atom(null, "loginState").pipe(
  withAssign((_, name) => ({
    qr: atom(null, `${name}.qr`).pipe(
      withAssign((_, name) => ({
        generation: atom(0, `${name}.generation`),
        socket: atom<WebSocket | null>(null, `${name}.socket`).pipe(withReset()),
        url: atom<string | null>(null, `${name}.qrUrl`).pipe(withReset()),
        token: atom<string | null>(null, `${name}.token`).pipe(withReset()),
        status: atom<AuthLoginQRStatus>("idle", `${name}.status`).pipe(withReset()),
        verify: atom(null, `${name}.verify`).pipe(
          withAssign((_, name) => ({
            status: atom<"idle" | "confirmed" | "declined">("idle", `${name}.status`).pipe(withReset()),
            token: atom<string | null>(null, `${name}.token`).pipe(withReset())
          }))
        )
      })),
    ),
    game: atom(null, `${name}.game`).pipe(
      withAssign((_, name) => ({
        code: atom<string | null>(null, `${name}.code`).pipe(withReset()),
      })),
    ),
  })),
);

loginState.qr.status.onChange((ctx, state) => {
  if (state === 'verified') {
    spawn(ctx, (spawnCtx) => login.qr.createSession(spawnCtx))
  }
})

export const login = atom(null, "login").pipe(
  withAssign((_, name) => ({
    getVisitorId: async () => {
      const fpPromise = FingerprintJS.load();
      const fp = await fpPromise;
      const result = await fp.get();
      return result.visitorId;
    },
    basic: atom(null, `${name}.basic`).pipe(
      withAssign((_, name) => ({
        submit: reatomAsync(async (ctx) => {
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

          const { success, error, data: json } = loginSchema.safeParse({
            nickname: ctx.get(authState.fields.nickname),
            password: ctx.get(authState.fields.password),
          });

          if (!success) return error;

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
              const issue = res.issues.map((d) => d)[0];
              const property = issue.path[0].toString() as AuthErrorType;

              authState.globalError(ctx, issue.message);
              authState.errorsType(ctx, (state) => [...state, property]);
              authState.isProcessing(ctx, false);

              return;
            }

            window.location.reload()
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
    qr: atom(null, `${name}.qr`).pipe(
      withAssign((_, name) => ({
        generate: reatomAsync(async (ctx) => {
          const generation = ctx.get(loginState.qr.generation);
          const visitorId = await login.getVisitorId();

          const res = await client
            .post("/auth/login/qr/generate", { json: { visitorId } })

          // The request may finish after the QR view was closed.
          if (ctx.get(loginState.qr.generation) !== generation) return;

          const pdUrl = new URL(`${env.VITE_API_URL}/auth/login/qr/verify`)
          pdUrl.searchParams.append("token", res.token)

          loginState.qr.url(ctx, pdUrl.href);
          loginState.qr.token(ctx, res.token)

          login.qr.events(ctx, res.token)
        }, `${name}.generate`).pipe(
          withStatusesAtom(),
          withErrorAtom(),
        ),
        createSession: reatomAsync(async (ctx) => {
          const token = ctx.get(loginState.qr.token);
          invariant(token, "Token is not defined");

          return await client
            .post("/auth/login/qr/create", { params: { query: { token } } })
        }, {
          name: `${name}.createSession`,
          onFulfill: () => {
            window.location.reload()
          },
          onReject: (_, e) => {
            logError(e, { type: 'combined' })
          }
        }),
        events: reatomAsync(async (ctx, token: string) => {
          const currSocket = ctx.get(loginState.qr.socket)

          if (currSocket) {
            currSocket.close()
            loginState.qr.socket(ctx, null)
          }

          const wsUrl = createWsUrl({
            host: getApiHost(),
            isSecure: import.meta.env.PROD,
            path: `auth/login/qr/events?token=${token}`,
            port: import.meta.env.DEV ? 5104 : undefined,
          })

          const socket = new WebSocket(wsUrl)
          loginState.qr.socket(ctx, socket)

          if (socket.readyState !== WebSocket.OPEN) {
            await onEvent(ctx, socket, 'open')
          }

          onEvent(ctx, socket, 'message', ({ data: raw }) => {
            const data = JSON.parse(raw) as QREventsPayload
            loginState.qr.status(ctx, data.event)
          })
          onEvent(ctx, socket, 'open', () => {
            loginState.qr.status(ctx, "connected")
          })
          onEvent(ctx, socket, 'close', () => {
            ctx.controller.abort()
          })
          onEvent(ctx, socket, 'error', () => {
            loginState.qr.status.reset(ctx)
            ctx.controller.abort()
          })
        }, `${name}.events`),
        close: action((ctx) => {
          const socket = ctx.get(loginState.qr.socket)
          socket?.close()

          loginState.qr.generation(ctx, (state) => state + 1)
          loginState.qr.socket.reset(ctx)
          loginState.qr.url.reset(ctx)
          loginState.qr.token.reset(ctx)
          loginState.qr.status.reset(ctx)
        }, `${name}.close`),
        verify: atom(null, `${name}.verify`).pipe(
          withAssign((_, name) => ({
            validateToken: reatomAsync(async (ctx, token: string) => {
              const result = await ctx.schedule(() =>
                client.get("/auth/login/qr/validate", { params: { query: { token } } }),
              );

              return { result, params: { token } }
            }, {
              name: `${name}.validateToken`,
              onFulfill: (ctx, { result, params: { token } }) => {
                loginState.qr.verify.status(ctx, "idle")
                loginState.qr.verify.token(ctx, token)
              }
            }).pipe(
              withStatusesAtom(),
              withErrorAtom(),
              withDataAtom()
            ),
            confirm: reatomAsync(async (ctx) => {
              const token = ctx.get(loginState.qr.verify.token);
              invariant(token, "Token is not defined");

              return await client
                .post("/auth/login/qr/confirm", { params: { query: { token } } })
            }, {
              name: `${name}.confirm`,
              onFulfill: (ctx) => {
                loginState.qr.verify.status(ctx, "confirmed")
              }
            }).pipe(
              withStatusesAtom(),
              withErrorAtom()
            ),
            decline: reatomAsync(async (ctx) => {
              const token = ctx.get(loginState.qr.verify.token);
              invariant(token, "Token is not defined");

              return await client
                .post("/auth/login/qr/decline", { params: { query: { token } } })
            }, {
              name: `${name}.decline`,
              onFulfill: (ctx) => {
                loginState.qr.verify.status(ctx, "declined")
              }
            }).pipe(
              withStatusesAtom(),
              withErrorAtom()
            ),
          }))
        ),
      })),
    ),
    game: atom(null, `${name}.game`).pipe(
      withAssign((_, name) => ({
        generate: reatomAsync(async (ctx) => {
          const visitorId = await login.getVisitorId();

          const res = await client
            .post("/auth/login/game/generate", { json: { visitorId } })

          loginState.game.code(ctx, res.code);
        }, `${name}.generate`).pipe(
          withStatusesAtom(),
          withErrorAtom()
        ),
      })),
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
  if (state !== "qr") login.qr.close(ctx)
});

authState.type.onChange((ctx, state) => {
  if (state !== "login") {
    login.qr.close(ctx)
    return;
  }

  if (ctx.get(authLoginVariantAtom) === "qr") {
    login.qr.generate(ctx);
  }
});

export const authLoginQRIsErrorAtom = atom((ctx) =>
  ctx.spy(login.qr.verify.confirm.errorAtom) || ctx.spy(login.qr.verify.decline.errorAtom),
);

const authIsValidAtom = atom<boolean>((ctx) => {
  const type = ctx.spy(authState.type);

  const { nickname, password, findout, acceptRules } = {
    nickname: ctx.spy(authState.fields.nickname),
    password: ctx.spy(authState.fields.password),
    findout: ctx.spy(authState.fields.findout),
    acceptRules: ctx.spy(authState.fields.acceptRules)
  }

  const isBaseValid = nickname.length >= 2 && password.length >= 6;
  if (!isBaseValid) return false;

  if (type !== "register") return true;

  return !!findout && !!acceptRules;
}, "authIsValid");

export const authSubmitIsDisabledAtom = atom((ctx) => {
  const isPending = ctx.spy(login.basic.submit.statusesAtom).isPending;
  const isInvalid = !ctx.spy(authIsValidAtom);
  const isPofActive = ctx.spy(isPofActiveAtom)
  return isPofActive || isPending || isInvalid;
}, "authSubmitIsDisabled");
