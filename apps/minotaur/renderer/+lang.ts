import type { PageContext } from "vike/types";

export default function lang(pageCtx: PageContext) {
  return pageCtx.locale ?? "ru";
}
