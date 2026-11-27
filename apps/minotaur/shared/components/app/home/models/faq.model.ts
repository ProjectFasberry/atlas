import { reatomAsync, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { client } from "@/shared/lib/client-wrapper"
import { getLocale } from "@/paraglide/runtime"

export const homeFaq = reatomAsync(async (ctx) => {
  return await client.get("/faq", {
    params: { query: { scope: "home", locale: getLocale() } },
    signal: ctx.controller.signal,
  })
}, "homeFaq").pipe(
  withDataAtom(null),
  withStatusesAtom(),
  withErrorAtom(),
)
