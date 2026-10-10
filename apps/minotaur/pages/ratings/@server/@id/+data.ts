import { logRouting } from "@/shared/lib/log";
import { wrapTitle } from "@/shared/lib/helpers";
import { getStaticImage } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-react/useConfig";
import type { PageContextServer } from "vike/types";

const image = getStaticImage("arts/adventure-in-blossom.jpg")

function metadata(
  pageCtx: PageContextServer
) {
  const { server, type } = {
    server: pageCtx.routeParams.server,
    type: pageCtx.routeParams.id,
  }

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
