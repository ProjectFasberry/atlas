import type { PageContext } from "vike/types";
import { overwriteGetLocale } from "@/paraglide/runtime";
import { logRouting } from "@/shared/lib/log";
import { getLocaleByRuntime } from "@/shared/locales/helpers";

export const onBeforeRoute = (pageCtx: PageContext) => {
  logRouting(pageCtx.urlPathname, "onBeforeRoute")

  const locale = getLocaleByRuntime(pageCtx)
  overwriteGetLocale(() => locale);

  return {
    pageContext: {
      locale
    }
  }
}
