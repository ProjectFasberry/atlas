import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { RESOURCEPACK_READ_PERMISSION } from "@/shared/consts/permissions";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

/** Reading packs is a separate permission; the layout guard only checks the panel. */
export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const isValid = user.meta.permissions.includes(RESOURCEPACK_READ_PERMISSION);
  if (!isValid) throw redirect("/private/")
}
