import { logRouting } from "@/shared/lib/log";
import { getStaticImage } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContextServer } from "vike/types";
import { getNotExistType, wrapTitle } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";

export type Data = Awaited<ReturnType<typeof data>>;

const image = getStaticImage("arts/sand-camel.jpg")

function metadata(pageCtx: PageContextServer) {
  const type = getNotExistType(pageCtx.urlParsed.search)
  const title = wrapTitle(translate[`${type}.not-found`]());

  return {
    title,
    image
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  const meta = metadata(pageCtx);
  config(meta);

  return {
    title: meta.title
  }
}
