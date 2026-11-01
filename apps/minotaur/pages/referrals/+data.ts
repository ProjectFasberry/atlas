import { logRouting } from "@/shared/lib/log";
import { getIsAuthed } from "@/shared/models/app/utils";
import { wrapTitle } from "@/shared/lib/helpers";
import { useConfig } from "vike-react/useConfig";
import { redirect } from "vike/abort";
import { type PageContext } from "vike/types";
import { translate } from "@/shared/locales/helpers";

function metadata() {
  const title = wrapTitle(translate["referrals.page.title"]());
  const description = translate["referrals.page.description"]();

  return {
    title,
    description
  }
}

export function data(pageCtx: PageContext) {
  logRouting(pageCtx.urlPathname, "data");

  const isAuth = getIsAuthed(pageCtx.snapshot)
  if (!isAuth) throw redirect("/auth")

  const config = useConfig()
  config(metadata())
}
