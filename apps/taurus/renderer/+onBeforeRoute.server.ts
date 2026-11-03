import type { PageContext } from "vike/types";
import { createCtx } from "@reatom/framework";
import { snapshotAtom } from "@/shared/models/ssr";
import { baseLocale } from "@/paraglide/runtime";
import { tryGetContext } from "hono/context-storage";
import { appState } from "@/shared/models/app.model";

const defineLocale = () => {
  const ctx = tryGetContext<Env>();
  if (!ctx) return baseLocale;

  // Paraglide's middleware keeps the locale in AsyncLocalStorage, so `getLocale()`
  // is request-scoped and must not be overwritten globally.
  return ctx.var.locale;
}

export const onBeforeRoute = (pageCtx: PageContext) => {
  const locale = defineLocale();

  const ctx = createCtx();
  appState.locale(ctx, locale)
  pageCtx.snapshot = ctx.get(snapshotAtom)
}
