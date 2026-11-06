import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { RELEASES_READ_PERMISSION } from "@/shared/models/current-user/index.model";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

/**
 * The panel guard only checks `config.panel.read`; releases have their own
 * permission and must not even render for roles that cannot read them.
 */
export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const isValid = user.meta.permissions.includes(RELEASES_READ_PERMISSION);
  if (!isValid) throw redirect("/private/")
}
