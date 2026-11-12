import {
  action, atom, reatomAsync, spawn, withAssign, withDataAtom, withErrorAtom, withReset, withStatusesAtom
} from "@reatom/framework";
import { onEvent } from "@reatom/web";
import { client } from "@/shared/lib/client-wrapper";
import { invariant } from "@/shared/lib/utils";
import { createWsUrl, getApiHost } from "@/shared/lib/helpers";
import { env } from "@/shared/env";
import { logError } from "@/shared/lib/log";
import { pageState } from "@/shared/models/page-context.model";
import { getNextPath, goAfterAuth } from "@/shared/lib/auth-redirect";
import { getVisitorId } from "./visitor.model";

export type QREventsEvent =
  | "expired"
  | "verified"
  | "connected" // ws only event
  | "declined";

export type QREventsPayload = {
  event: QREventsEvent;
};

export type AuthLoginQRStatus = QREventsEvent | "idle" | "error"

export const qrState = atom(null, "qrLoginState").pipe(
  withAssign((_, name) => ({
    generation: atom(0, `${name}.generation`),
    socket: atom<WebSocket | null>(null, `${name}.socket`).pipe(withReset()),
    url: atom<string | null>(null, `${name}.url`).pipe(withReset()),
    token: atom<string | null>(null, `${name}.token`).pipe(withReset()),
    status: atom<AuthLoginQRStatus>("idle", `${name}.status`).pipe(withReset()),
    verify: atom(null, `${name}.verify`).pipe(
      withAssign((_, name) => ({
        status: atom<"idle" | "confirmed" | "declined">("idle", `${name}.status`).pipe(withReset()),
        token: atom<string | null>(null, `${name}.token`).pipe(withReset())
      }))
    )
  }))
);

export const qrLogin = atom(null, "qrLogin").pipe(
  withAssign((_, name) => ({
    generate: reatomAsync(async (ctx) => {
      const generation = ctx.get(qrState.generation);
      qrState.status(ctx, "idle");
      const visitorId = await getVisitorId();

      const res = await client
        .post("/auth/login/qr/generate", { json: { visitorId }, timeout: 10000 })

      // The request may finish after the QR view was closed.
      if (ctx.get(qrState.generation) !== generation) return;

      const pdUrl = new URL(`${env.VITE_API_URL}/auth/login/qr/verify`)
      pdUrl.searchParams.append("token", res.token)

      qrState.url(ctx, pdUrl.href);
      qrState.token(ctx, res.token)

      qrLogin.events(ctx, res.token)
    }, `${name}.generate`).pipe(
      withStatusesAtom(),
      withErrorAtom(),
    ),
    createSession: reatomAsync(async (ctx) => {
      const token = ctx.get(qrState.token);
      invariant(token, "Token is not defined");

      return await client
        .post("/auth/login/qr/create", { params: { query: { token } } })
    }, {
      name: `${name}.createSession`,
      onFulfill: (ctx) => {
        goAfterAuth(getNextPath(ctx.get(pageState.urlParsed)?.search))
      },
      onReject: (ctx, e) => {
        qrState.status(ctx, "error")
        logError(e, { type: 'combined' })
      }
    }),
    events: reatomAsync(async (ctx, token: string) => {
      const currSocket = ctx.get(qrState.socket)

      if (currSocket) {
        currSocket.close()
        qrState.socket(ctx, null)
      }

      const wsUrl = createWsUrl({
        host: getApiHost(),
        isSecure: import.meta.env.PROD,
        path: `auth/login/qr/events?token=${token}`,
        port: import.meta.env.DEV ? 5104 : undefined,
      })

      const socket = new WebSocket(wsUrl)
      qrState.socket(ctx, socket)

      onEvent(ctx, socket, 'message', ({ data: raw }) => {
        const data = JSON.parse(raw) as QREventsPayload
        qrState.status(ctx, data.event)
      })
      onEvent(ctx, socket, 'close', () => {
        ctx.controller.abort()
      })
      onEvent(ctx, socket, 'error', () => {
        qrState.status(ctx, "error")
        ctx.controller.abort()
      })

      if (socket.readyState !== WebSocket.OPEN) {
        await onEvent(ctx, socket, 'open')
      }
    }, `${name}.events`),
    close: action((ctx) => {
      const socket = ctx.get(qrState.socket)
      socket?.close()

      qrState.generation(ctx, (state) => state + 1)
      qrState.socket.reset(ctx)
      qrState.url.reset(ctx)
      qrState.token.reset(ctx)
      qrState.status.reset(ctx)
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
            qrState.verify.status(ctx, "idle")
            qrState.verify.token(ctx, token)
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom(),
          withDataAtom()
        ),
        confirm: reatomAsync(async (ctx) => {
          const token = ctx.get(qrState.verify.token);
          invariant(token, "Token is not defined");

          return await client
            .post("/auth/login/qr/confirm", { params: { query: { token } } })
        }, {
          name: `${name}.confirm`,
          onFulfill: (ctx) => {
            qrState.verify.status(ctx, "confirmed")
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        ),
        decline: reatomAsync(async (ctx) => {
          const token = ctx.get(qrState.verify.token);
          invariant(token, "Token is not defined");

          return await client
            .post("/auth/login/qr/decline", { params: { query: { token } } })
        }, {
          name: `${name}.decline`,
          onFulfill: (ctx) => {
            qrState.verify.status(ctx, "declined")
          }
        }).pipe(
          withStatusesAtom(),
          withErrorAtom()
        ),
      }))
    ),
  }))
);

qrState.status.onChange((ctx, state) => {
  if (state === 'verified') {
    spawn(ctx, (spawnCtx) => qrLogin.createSession(spawnCtx))
  }
})

export const authLoginQRIsErrorAtom = atom((ctx) =>
  ctx.spy(qrLogin.verify.confirm.errorAtom) || ctx.spy(qrLogin.verify.decline.errorAtom),
);
