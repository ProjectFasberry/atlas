import { env } from "@/shared/env";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";

export type CommunityItem = {
  title: string
  description: string
  href: string
  icon: string
  external?: boolean
}

export const createCommunityItems = (): CommunityItem[] => [
  {
    title: translate["community.items.map.title"](),
    description: translate["community.items.map.description"](),
    href: `${env.VITE_APP_URL}/map`,
    icon: getStaticObject("minecraft", "items/adventure_icon.png"),
    external: true
  },
  {
    title: translate["community.items.wiki.title"](),
    description: translate["community.items.wiki.description"](),
    href: "https://wiki.fasberry.fun/",
    icon: getStaticObject("minecraft", "icons/book_big.webp"),
    external: true
  },
  {
    title: translate["community.items.modpack.title"](),
    description: translate["community.items.modpack.description"](),
    href: "/modpack",
    icon: getStaticObject("minecraft", "icons/chest_closed.webp")
  },
  {
    title: translate["community.items.gallery.title"](),
    description: translate["community.items.gallery.description"](),
    href: "/gallery",
    icon: getStaticObject("minecraft", "icons/fishing_bobber.webp")
  }
]
