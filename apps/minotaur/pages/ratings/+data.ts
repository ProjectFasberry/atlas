import { useConfig } from 'vike-react/useConfig'
import { wrapTitle } from "@/shared/lib/helpers"
import { getStaticImage } from '@/shared/lib/helpers'
import { type PageContextServer } from 'vike/types'
import { logRouting } from '@/shared/lib/log'
import { translate } from '@/shared/locales/helpers'

const image = getStaticImage("arts/sand-camel.jpg")

function metadata() {
  const title = wrapTitle(translate["ratings.page.title"]())
  const description = translate["ratings.page.description"]()

  return {
    title,
    description,
    image,
  }
}

export async function data(pageCtx: PageContextServer) {
  logRouting(pageCtx.urlPathname, "data");

  const config = useConfig()
  config(metadata())
}
