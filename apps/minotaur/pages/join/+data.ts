import { logRouting } from "@/shared/lib/log"
import { wrapTitle } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { useConfig } from "vike-react/useConfig"
import type { PageContext } from "vike/types"

export async function data(pageCtx: PageContext) {
  logRouting(pageCtx.urlPathname, "data")

  useConfig()({
    title: wrapTitle(translate["team.join.title"]()),
    description: translate["team.join.description"](),
  })
}
