import { action, atom } from "@reatom/framework";
import { translate } from "@/shared/locales/helpers";

export type FaqItem = { value: string, question: string, answer: string }

export const createFaqItems = (): FaqItem[] => [
  {
    value: "1",
    question: translate["faq.items.1.question"](),
    answer: translate["faq.items.1.answer"]()
  },
  {
    value: "2",
    question: translate["faq.items.2.question"](),
    answer: translate["faq.items.2.answer"]()
  },
  {
    value: "3",
    question: translate["faq.items.3.question"](),
    answer: translate["faq.items.3.answer"]()
  },
  {
    value: "4",
    question: translate["faq.items.4.question"](),
    answer: translate["faq.items.4.answer"]()
  }
]

/** First question is open by default, so the block never looks like a dead list. */
export const faqOpenAtom = atom<string[]>(["1"], "faqOpenAtom")

export const setFaqOpen = action(
  (ctx, value: string[]) => faqOpenAtom(ctx, value),
  "setFaqOpen"
)
