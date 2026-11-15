import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { TEAM_APPLICATIONS_READ_PERMISSION } from "@/shared/consts/permissions";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

/** Team applications became a tab of the moderation page. */
export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  if (!user.meta.permissions.includes(TEAM_APPLICATIONS_READ_PERMISSION)) throw redirect("/private/")

  throw redirect("/private/moderation?tab=team")
}
