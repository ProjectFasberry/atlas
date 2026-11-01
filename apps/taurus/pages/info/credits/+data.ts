import { wrapTitle } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-solid/useConfig"
import type { PageContextServer } from "vike/types";

export const data = async (pageCtx: PageContextServer) => {
  const config = useConfig();
  const title = wrapTitle(translate["pages.info.credits.title"]())

  config({
    title
  })
}
