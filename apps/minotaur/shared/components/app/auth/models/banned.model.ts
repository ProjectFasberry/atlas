import { client } from "@/shared/lib/client-wrapper"
import { atom, reatomAsync, withAssign, withCache, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework"

export const banned = atom(null, "banned").pipe(
  withAssign((_, name) => ({
    fetch: reatomAsync(async (ctx) => {
      return await client.get("/validate/ban")
    }, `${name}.fetch`).pipe(
      withDataAtom(),
      withStatusesAtom(),
      withCache({ swr: false }),
      withErrorAtom()
    )
  }))
)
