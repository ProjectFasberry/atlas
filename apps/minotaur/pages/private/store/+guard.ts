import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { STORE_ITEM_READ_PERMISSION } from "@/shared/consts/permissions";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  if (!user.meta.permissions.includes(STORE_ITEM_READ_PERMISSION)) throw redirect("/private/")
}
