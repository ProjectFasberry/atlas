import { wrapTitle } from "@/shared/lib/helpers"
import { createPageHead } from "@/shared/lib/page-head"
import { useConfig } from "vike-solid/useConfig"
import type { PageContextServer } from "vike/types"
import { translate } from "@/shared/locales/helpers"
import { asServersContent, type ServersContent } from "@/shared/api/site"
import { loadPageData, type EditablePageData } from "@/shared/api/page-data"

export type Data = EditablePageData & {
  content: ServersContent | null
}

export async function data(pageCtx: PageContextServer): Promise<Data> {
  const config = useConfig()

  const pageData = await loadPageData("servers", pageCtx)
  const content = asServersContent(pageData.content)

  const title = wrapTitle(translate["servers.page.title"]())
  const description = translate["servers.page.description"]()

  config({
    title,
    description,
    Head: createPageHead(pageCtx, { title, description }),
  })

  return { ...pageData, content }
}
