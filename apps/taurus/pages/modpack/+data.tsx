import { wrapTitle } from "@/shared/lib/helpers"
import { createPageHead } from "@/shared/lib/page-head"
import { useConfig } from "vike-solid/useConfig"
import type { PageContext } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { mainClient } from "@/shared/api/client"
import { apiRequestHeaders } from "@/shared/api/server"
import { loadPageData } from "@/shared/api/page-data"
import { getLocale } from "@/paraglide/runtime"
import { fetchFaq } from "@/shared/api/faq"

export type Data = Awaited<ReturnType<typeof data>>

export async function data(pageCtx: PageContext) {
  const config = useConfig()

  const locale = getLocale()
  const [pageData, faq, data] = await Promise.all([
    loadPageData("modpack", pageCtx),
    fetchFaq("modpack", locale).catch(() => []),
    mainClient.GET("/modpack/list", { headers: apiRequestHeaders(pageCtx) })
      .then(r => r.data?.data ?? [])
      .catch(() => null),
  ]);

  const title = wrapTitle(translate["pages.modpack.title"]())
  const description = translate["pages.modpack.description"]()

  config({
    title,
    description,
    Head: createPageHead(pageCtx, { title, description })
  })

  return {
    ...pageData,
    data: data ?? [],
    faq,
    failed: data === null,
    sections: pageData.content,
  }
}
