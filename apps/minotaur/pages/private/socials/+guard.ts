import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { OPTIONS_READ_PERMISSION } from "@/shared/consts/permissions";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const isValid = user.meta.permissions.includes(OPTIONS_READ_PERMISSION)
  if (!isValid) throw redirect("/private/")
}
