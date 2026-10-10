import { logRouting } from "@/shared/lib/log";
import { wrapTitle } from "@/shared/lib/helpers";
import { getStaticImage } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContext } from "vike/types";

const image = getStaticImage("arts/wide.jpg");

function metadata() {
  const title = wrapTitle(translate["recovery.page.title"]());
  const description = translate["recovery.page.description"]();

  return {
    title,
    description,
    image
  }
}

export async function data(pageCtx: PageContext) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata())
}
