import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";

/** The history page became the audit tab of the moderation page. */
export function guard(_pageCtx: PageContextServer) {
  throw redirect("/private/moderation?tab=audit")
}
