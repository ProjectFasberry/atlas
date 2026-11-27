import { action, atom, withAssign } from "@reatom/framework";

export type Modpacks = ExtractApiData<"getModpackList">["data"]
export type Modpack = Modpacks[number]

export const modpackState = atom(null, "modpackState").pipe(
  withAssign((_, name) => ({
    faqOpen: atom<string[]>(["1"], `${name}.faqOpen`)
  }))
)

export const setModpackFaq = action(
  (ctx, value: string[]) => modpackState.faqOpen(ctx, value),
  "setModpackFaq"
)

