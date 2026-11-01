import { env } from "./env";
import type { BrowserOptions } from "@sentry/browser";
import { invariant } from "./lib/utils";
import type { Client } from "@sentry/core";

const baseOptions: BrowserOptions = {
  dsn: env.VITE_SENTRY_DSN,
  tracesSampleRate: 0.01,
  enableLogs: true
}

let browser: Maybe<Client> = undefined
let server: Maybe<Client> = undefined

const createSentry = () => {
  return {
    async init({ variant }: { variant: "browser" | "server" }): Promise<void> {
      if (!import.meta.env.PROD) {
        console.warn("Skipping Sentry initialization in development mode")
        return;
      }

      if (variant === 'browser') {
        const { browserTracingIntegration, init } = await import("@sentry/browser")

        browser = init({
          ...baseOptions,
          integrations: [
            browserTracingIntegration()
          ],
          sendClientReports: false,
        })
        return;
      }

      if (variant === 'server' && import.meta.env.SSR) {
        const { init } = await import("@sentry/node")

        server = init({
          ...baseOptions,
          enableLogs: true
        })
        return;
      }
    },
    getBrowser() {
      invariant(browser, 'Browser not initialized')
      return browser
    },
    getServer() {
      invariant(server && import.meta.env.SSR, 'Server not initialized')
      return server
    },
  }
}

export const sentry = createSentry()
