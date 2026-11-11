import type { Server } from "vike/types";
import Elysia from "elysia";
import vike from "@vikejs/elysia";
import compress from '@universal-middleware/compress'
import consola from "consola";
import { env } from "@/shared/env";
import { sentry } from "@/shared/sentry";
import { paraglideMiddleware } from "@/paraglide/server";
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

const app = new Elysia()
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
  /**
   * Paraglide keeps the request locale in AsyncLocalStorage, so the scope has to
   * cover the whole render. A per-request override of the global `getLocale`
   * would leak between parallel requests.
   */
  fetch: (request: Request) =>
    paraglideMiddleware(request, ({ request: scopedRequest }) => app.fetch(scopedRequest)),
  prod: {
    port
  }
} satisfies Server;
