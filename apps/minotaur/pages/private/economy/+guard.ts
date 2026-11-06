import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { ECONOMY_READ_PERMISSION } from "@/shared/models/current-user/index.model";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

/** The panel guard only checks `config.panel.read`; the economy has its own. */
export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const isValid = user.meta.permissions.includes(ECONOMY_READ_PERMISSION);
  if (!isValid) throw redirect("/private/")
}
