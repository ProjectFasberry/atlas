import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { HISTORY_READ_PERMISSION, TEAM_APPLICATIONS_READ_PERMISSION } from "@/shared/consts/permissions";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const allowed = [TEAM_APPLICATIONS_READ_PERMISSION, HISTORY_READ_PERMISSION]
    .some((permission) => user.meta.permissions.includes(permission))
  if (!allowed) throw redirect("/private/")
}
