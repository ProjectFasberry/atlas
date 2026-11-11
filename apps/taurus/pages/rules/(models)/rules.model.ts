import { action, atom, withAssign } from "@reatom/framework";

export const rulesState = atom(null, "rulesState").pipe(
  withAssign((_, name) => ({
    search: atom("", `${name}.search`),
    /** Category ids that are expanded; the first category is open on load. */
    open: atom<string[]>(["rules-0"], `${name}.open`)
  }))
)

export const setRulesSearch = action(
  (ctx, value: string) => rulesState.search(ctx, value),
  "setRulesSearch"
)

export const setRulesOpen = action(
  (ctx, value: string[]) => rulesState.open(ctx, value),
  "setRulesOpen"
)
