import { wrapTitle } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { useConfig } from "vike-solid/useConfig"

export const data = async () => {
  const config = useConfig();

  const title = wrapTitle(translate["error-page.title"]())

  config({
    title
  })
}
