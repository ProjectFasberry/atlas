import type { Server } from "vike/types";
import { Hono } from "hono";
import vike from "@vikejs/hono";
import { env } from "@/shared/env";
import { paraglideMiddleware } from "../paraglide/server";
import { contextStorage } from "hono/context-storage";

const port = 3005;
process.env.PORT = String(port)

const app = new Hono<Env>()
  .get("/health", async (ctx) => ctx.status(200))
  .use(contextStorage())
  .use("*", async (ctx, next) =>
    paraglideMiddleware(ctx.req.raw, ({ locale }) => {
      ctx.set("locale", locale)
      return next()
    })
  )

vike(app);

const output = `
  Runtime: ${typeof Bun !== 'undefined' ? 'bun' : 'node'}
  Port: ${port}
  Env: ${JSON.stringify(env, null, 2)}
  Routes: \n${app.routes.map((r) => "- " + r.method + " " + r.path).join("\n")}
`

console.log(output);

export default {
  fetch: app.fetch,
  prod: {
    port
  }
} satisfies Server;
