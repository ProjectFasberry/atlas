import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";

/** The history page became the first tab of `/private/audit`. */
export function guard(_pageCtx: PageContextServer) {
  throw redirect("/private/audit?tab=history")
}
