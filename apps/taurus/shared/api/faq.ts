import { mainClient } from "./client"
import type { paths } from "../types/gen"

type FaqOperation = paths["/faq"]["get"]
type FaqQuery = NonNullable<FaqOperation["parameters"]["query"]>

export type FaqApiItem = FaqOperation["responses"][200]["content"]["application/json"]["data"][number]
type FaqScope = NonNullable<FaqQuery["scope"]>
type FaqLocale = NonNullable<FaqQuery["locale"]>

export type FaqDisplayItem = {
  value: string
  question: string
  answer: string
  href?: string | null
  linkLabel?: string | null
}

export const toFaqItems = (items: FaqApiItem[]): FaqDisplayItem[] => items.map((item) => ({
  value: String(item.position),
  question: item.question,
  answer: item.answer,
  href: item.linkHref,
  linkLabel: item.linkLabel,
}))

export async function fetchFaq(scope: FaqScope, locale: FaqLocale): Promise<FaqApiItem[]> {
  const { data, error } = await mainClient.GET("/faq", {
    params: { query: { scope, locale } },
  })

  if (error || !data) throw new Error("FAQ request failed")

  return data.data
}
