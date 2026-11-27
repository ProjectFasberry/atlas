import { type PageContextServer } from "vike/types";
import { redirect } from "vike/abort";
import { getDataFromSnapshot } from "@/shared/models/app/utils";

const CONTENT_PERMISSIONS = [
  "news.create", "news.update", "news.delete",
  "banners.create", "banners.delete",
  "events.create", "events.delete",
  "lands.read",
]

export function guard(pageCtx: PageContextServer) {
  const user = getDataFromSnapshot("currentUser", pageCtx.snapshot)
  if (!user) throw redirect("/")

  const allowed = CONTENT_PERMISSIONS.some((permission) => user.meta.permissions.includes(permission))
  if (!allowed) throw redirect("/private/")
}
