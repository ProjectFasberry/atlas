import { type PageContextServer } from "vike/types"
import { redirect } from "vike/abort"
import { getDataFromSnapshot } from "@/shared/models/app/utils"

/** The form posts a nickname, so the visitor has to be signed in. */
export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/auth")
}
