import { toast } from "sonner";
import { logger } from "./logger";
import { ENVIRONMENT } from "../consts";
import { isError } from "./utils";

const EVENTS = {
  "console": null,
  "toast": (e: Error) => void toast.error(e.message),
  "combined": (e: Error) => void toast.error(e.message)
}

type LogErrorParams = { type?: 'console' | 'toast' | 'combined' };

export function logError(e: unknown, { type = 'console' }: LogErrorParams = {}) {
  if (!isError(e)) return;

  const cb = EVENTS[type]

  if (typeof cb === 'undefined' || cb === null) {
    if (import.meta.env.DEV) {
      console.warn('Skipped logging: invalid log type');
    }
    return;
  }

  cb(e)
}

const routingLogger = logger.withTag('Routing');

export function logRouting(path: string, hook: string): void {
  if (
    (import.meta.env.DEV) || (import.meta.env.PROD && ENVIRONMENT === 'server')
  ) {
    routingLogger.log(`${path} called +${hook}.${ENVIRONMENT}`);
  }
}

export const loggerWithEnv = logger.withTag(ENVIRONMENT);
