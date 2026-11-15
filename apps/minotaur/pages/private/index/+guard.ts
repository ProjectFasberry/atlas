import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";

const CONTENT_PARENTS = ["news", "banner", "event", "modpack", "lands"]
const CONFIG_TABS = ["general", "roles", "dictionaries", "servers"]

/** Old config links (`?parent=`) moved to the content and api pages. */
export function guard(pageCtx: PageContextServer) {
  const parent = pageCtx.urlParsed.search.parent

  if (typeof parent !== "string") return

  if (parent === "api") throw redirect("/private/api-keys")

  if (CONTENT_PARENTS.includes(parent)) {
    throw redirect(`/private/content?tab=${encodeURIComponent(parent)}`)
  }

  if (CONFIG_TABS.includes(parent)) {
    throw redirect(`/private?tab=${encodeURIComponent(parent)}`)
  }
}
