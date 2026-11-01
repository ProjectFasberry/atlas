import { logRouting } from "@/shared/lib/log"
import { wrapTitle } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContext } from "vike/types"

export type Data = Awaited<ReturnType<typeof data>>;

function metadata() {
  const title = wrapTitle(translate["tasks.page.title"]());
  const description = translate["tasks.page.description"]();

  return {
    title,
    description
  }
}

export async function data(pageCtx: PageContext) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata())
}
