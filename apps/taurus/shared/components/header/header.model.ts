import { env } from "@/shared/env";
import { getStaticObject } from "@/shared/lib/helpers";
import { atom, withAssign } from "@reatom/framework";
import { translate } from "../../locales/helpers";

const APP_URL = env.VITE_APP_URL

export const logoImage = getStaticObject("minecraft", "static/fasberry_logo.webp")
export const expImage = getStaticObject("minecraft", "icons/experience_big.webp")

export type MainHeaderLink = {
  name: string,
  href: string,
  class?: string,
  childs?: { name: string, href: string }[]
}

export const createMainHeaderLinks = () => ([
  { name: translate["header.links.play"](), href: "/start", },
  { name: translate["header.links.servers"](), href: "/servers", },
  {
    name: translate["header.links.world"](),
    childs: [
      { name: translate["header.links.map"](), href: `${APP_URL}/map`, },
      { name: translate["header.links.wiki"](), href: "https://wiki.fasberry.fun", },
      { name: translate["header.links.gallery"](), href: "/gallery", },
    ],
  },
  {
    name: translate["header.links.community"](),
    childs: [
      { name: translate["header.links.support"](), href: "/support", },
      { name: translate["header.links.rules"](), href: "/rules", },
      { name: translate["header.links.discord"](), href: "https://api.fasberry.fun/misc/discord", },
      { name: translate["header.links.telegram"](), href: "https://api.fasberry.fun/misc/telegram", },
    ],
  },
]);

export const headerDrawerState = atom(null, "headerDrawerState").pipe(
  withAssign((_, name) => ({
    isOpen: atom(false, `${name}.isOpen`)
  }))
)
