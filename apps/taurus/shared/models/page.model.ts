import { atom, withAssign } from "@reatom/framework"
import type { PageContext } from "vike/types"

export const pageState = atom(null, "pageState").pipe(
  withAssign((_, name) => ({
    isClient: atom(false, `${name}.isClient`),
    urlParsed: atom<PageContext["urlParsed"] | null>(null, `${name}.urlParsed`)
  }))
)
