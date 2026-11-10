import type { Server } from "vike/types";
import Elysia from "elysia";
import vike from "@vikejs/elysia";
import compress from '@universal-middleware/compress'
import consola from "consola";
import { env } from "@/shared/env";
import { sentry } from "@/shared/sentry";
import { paraglideMiddleware } from "@/paraglide/server";
import { baseLocale } from "@/paraglide/runtime";
import { installProcessHandlers, messageOf, sendAlert } from "@repo/shared/notify/alerts";

installProcessHandlers("minotaur");

await sentry.init({ variant: "server" }).catch(e => {
  consola.error("Failed to initialize Sentry", e)
})

const port = Number(env["VITE_APP_PORT"])
process.env.PORT = String(port)

function printAppInfo() {
  consola.box({
    title: " App ",
    message: `
  Runtime: ${typeof Bun !== 'undefined' ? 'bun' : 'node'}
  Port: ${port}
  Stage: ${process.env.STAGE}
  Env: ${JSON.stringify(env, null, 2)}
  Routes: \n${app.routes.map((r) => "- " + r.method + "" + r.path).join("\n")}
    `
  })
}

const defineLocale = () => new Elysia()
  .derive(async (ctx) => {
    let locale = baseLocale;

    await paraglideMiddleware(ctx.request, ({ locale: newLocale, request: newRequest }) => {
      ctx.request = newRequest;
      locale = newLocale;
    })

    return { request: ctx.request, locale }
  })
  .as("global")

const app = new Elysia()
  .use(defineLocale())
  .onError(({ code, error, request, set }) => {
    const status = typeof code === "number" ? code : typeof set.status === "number" ? set.status : 500;
    if (status < 500) return;

    const path = new URL(request.url).pathname;

    void sendAlert({
      from: "minotaur",
      severity: "warning",
      message: `http ${request.method} ${path} [${code}]: ${messageOf(error)}`,
    });
  })
  .get("/health", ({ status }) => status(200))

vike(app, [compress()]);

printAppInfo();

export default {
  fetch: app.fetch,
  prod: {
    port
  }
} satisfies Server;
