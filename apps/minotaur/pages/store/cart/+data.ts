import { cart } from "@/shared/components/app/shop/models/store-cart.model";
import { logRouting } from "@/shared/lib/log";
import { wrapTitle } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { useConfig } from "vike-react/useConfig";
import { type PageContextServer } from "vike/types";

function metadata() {
  const title = wrapTitle(translate["cart.page.title"]())
  const description = translate["cart.page.description"]()

  return {
    title,
    description
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data")

  const config = useConfig()
  config(metadata())

  await cart.init(pageCtx)
}
