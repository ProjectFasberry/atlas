import type { PageContext } from "vike/types";
import { createCtx } from "@reatom/framework";
import { snapshotAtom } from "@/shared/models/ssr";
import { baseLocale, overwriteGetLocale } from "@/paraglide/runtime";
import { tryGetContext } from "hono/context-storage";
import { appState } from "@/shared/models/app.model";

const defineLocale = () => {
  const ctx = tryGetContext<Env>();
  if (!ctx) return baseLocale;

  const locale = ctx.var.locale
  overwriteGetLocale(() => locale)
  return locale;
}

export const onBeforeRoute = (pageCtx: PageContext) => {
  const locale = defineLocale();

  const ctx = createCtx();
  appState.locale(ctx, locale)
  pageCtx.snapshot = ctx.get(snapshotAtom)
}
