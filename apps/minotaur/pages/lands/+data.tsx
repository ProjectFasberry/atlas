import { type PageContextServer } from "vike/types";
import { useConfig } from 'vike-react/useConfig'
import { wrapTitle } from "@/shared/lib/helpers";
import { logRouting } from "@/shared/lib/log";
import { getStaticImage } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";

const image = getStaticImage("arts/clan-preview.jpg");

function metadata() {
  const title = wrapTitle(translate["lands.page.title"]());
  const description = translate["lands.page.description"]();

  return {
    title,
    description,
    image
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata())
}
