import { mainClient } from "./client"
import type { paths } from "../types/gen"

type FaqOperation = paths["/faq"]["get"]
type FaqQuery = NonNullable<FaqOperation["parameters"]["query"]>

export type FaqApiItem = FaqOperation["responses"][200]["content"]["application/json"]["data"][number]
export type FaqScope = NonNullable<FaqQuery["scope"]>
export type FaqLocale = NonNullable<FaqQuery["locale"]>

export async function fetchFaq(scope: FaqScope, locale: FaqLocale): Promise<FaqApiItem[]> {
  const { data, error } = await mainClient.GET("/faq", {
    params: { query: { scope, locale } },
  })

  if (error || !data) throw new Error("FAQ request failed")

  return data.data
}
