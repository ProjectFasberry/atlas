import { action, atom, withAssign } from "@reatom/framework";
import { translate } from "@/shared/locales/helpers";

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

export const modpackFaqItems = () => [
  {
    value: "1",
    question: translate["modpack.faq.items.1.question"](),
    answer: translate["modpack.faq.items.1.answer"]()
  },
  {
    value: "2",
    question: translate["modpack.faq.items.2.question"](),
    answer: translate["modpack.faq.items.2.answer"]()
  },
  {
    value: "3",
    question: translate["modpack.faq.items.3.question"](),
    answer: translate["modpack.faq.items.3.answer"]()
  }
]
