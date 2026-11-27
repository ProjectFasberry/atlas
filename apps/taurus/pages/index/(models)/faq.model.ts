import { action, atom } from "@reatom/framework";

export type FaqItem = {
  value: string
  question: string
  answer: string
  href?: string | null
  linkLabel?: string | null
}

export const faqOpenAtom = atom<string[]>(["1"], "faqOpenAtom")

export const setFaqOpen = action(
  (ctx, value: string[]) => faqOpenAtom(ctx, value),
  "setFaqOpen"
)
