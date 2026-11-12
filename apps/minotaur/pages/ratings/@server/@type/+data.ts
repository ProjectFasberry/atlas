import { logRouting } from "@/shared/lib/log";
import { wrapTitle } from "@/shared/lib/helpers";
import { getStaticImage } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-react/useConfig";
import type { PageContextServer } from "vike/types";
import { getRatingTypeLabel, getServerLabel } from "@/shared/components/app/ratings/labels";

const image = getStaticImage("arts/sand-camel.jpg")

function metadata(
  pageCtx: PageContextServer
) {
  const server = getServerLabel(pageCtx.routeParams.server)
  const type = getRatingTypeLabel(pageCtx.routeParams.type)

  const title = wrapTitle(translate["rating.page.title"]({ type, server }))
  const description = translate["ratings.page.description"]()

  return {
    title,
    description,
    image,
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata(pageCtx))
}
