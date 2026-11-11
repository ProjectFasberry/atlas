import { action, atom, withAssign } from "@reatom/framework";
import { toast } from "solid-sonner";
import { env } from "@/shared/env";
import { translate } from "@/shared/locales/helpers";

export const supportState = atom(null, "supportState").pipe(
  withAssign((_, name) => ({
    faqOpen: atom<string[]>(["1"], `${name}.faqOpen`)
  }))
)

export const setSupportFaq = action(
  (ctx, value: string[]) => supportState.faqOpen(ctx, value),
  "setSupportFaq"
)

export const supportFaqItems = () => [
  {
    value: "1",
    question: translate["support.faq.items.1.question"](),
    answer: translate["support.faq.items.1.answer"]()
  },
  {
    value: "2",
    question: translate["support.faq.items.2.question"](),
    answer: translate["support.faq.items.2.answer"]()
  },
  {
    value: "3",
    question: translate["support.faq.items.3.question"](),
    answer: translate["support.faq.items.3.answer"]()
  },
  {
    value: "4",
    question: translate["support.faq.items.4.question"](),
    answer: translate["support.faq.items.4.answer"]()
  }
]

export const copySupportLink = action((ctx) => {
  if (typeof navigator === "undefined" || !navigator.clipboard) return

  void navigator.clipboard
    .writeText(env.VITE_LANDING_ENDPOINT)
    .then(() => toast.success(translate["shared.copy-success"]()))
    .catch(() => toast.error(translate["shared.copy-failed"]()))
}, "copySupportLink")

export const telegramShareLink = () => {
  const url = encodeURIComponent(env.VITE_LANDING_ENDPOINT)
  const text = encodeURIComponent(translate["support.share-text"]())

  return `https://telegram.me/share/url?url=${url}&text=${text}`
}
