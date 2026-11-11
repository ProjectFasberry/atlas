import { reatomAsync, withAbort, withDataAtom, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { mainClient } from "@/shared/api/client";

export type NewsItem = {
  id: number
  title: string
  created_at: string
  description: string
  imageUrl: string
  views: number
}

export const newsList = reatomAsync(async (ctx) => {
  const response = await mainClient.GET("/news/list", {
    params: { query: { limit: 3, content: false } },
    signal: ctx.controller.signal
  })

  return response.data?.data?.data ?? []
}, "newsList").pipe(
  withDataAtom([] as NewsItem[]),
  withStatusesAtom(),
  withErrorAtom(),
  withAbort()
)
