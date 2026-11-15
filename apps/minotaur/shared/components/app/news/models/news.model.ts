import { client } from "@/shared/lib/client-wrapper"
import { atom } from "@reatom/framework";
import { withSsr } from "@/shared/models/ssr";
import { withAssign } from "@reatom/framework";

export type PublicNewsPayload = ExtractApiData<"getNewsList">["data"]
export type PublicNewsParams = ExtractApiParams<"getNewsList">["query"]
export type PublicNewsSingle = PublicNewsPayload["data"][number]

export const getNews = async (params: Partial<PublicNewsParams>, init?: RequestInit) => {
  return client.get("/news/list", { ...init, params: { query: { ...params, limit: params.limit ?? 32 } } })
}

export const newsState = atom(null, "newsState").pipe(
  withAssign((_, name) => ({
    data: atom<PublicNewsPayload["data"]>([], `${name}.data`).pipe(withSsr(`${name}.data`)),
  }))
)
