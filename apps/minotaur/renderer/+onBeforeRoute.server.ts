import type { PageContext } from "vike/types";
import { getLocale } from "@/paraglide/runtime";
import { logRouting } from "@/shared/lib/log";

export const onBeforeRoute = (pageCtx: PageContext) => {
  logRouting(pageCtx.urlPathname, "onBeforeRoute")

  return {
    pageContext: {
      locale: getLocale()
    }
  }
}
