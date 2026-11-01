import { CONFIG_PANEL_READ_PERMISSION, currentUserState } from "@/shared/models/current-user/index.model";
import { action, type Action, atom, type CtxSpy } from "@reatom/framework";
import { settingsState } from "../../settings/models/settings.model";
import { type IconName } from "@/shared/ui/icon"
import { logout } from "../../auth/models/logout.model";
import { pageState } from "@/shared/models/page-context.model";
import { translate } from "@/shared/locales/helpers";
import { userState } from "@/shared/models/app/index.model";

export type HeaderLink = {
  title: string,
  icon: IconName,
  label: string,
  href: string
}
export const createHeaderLinks = (): HeaderLink[] => [
  { title: translate["shared.header.links.main.value"](), icon: "sprite:category", label: translate["shared.header.links.main.label"](), href: "/" },
  { title: translate["shared.header.links.ratings.value"](), icon: "sprite:stars", label: translate["shared.header.links.ratings.value"](), href: "/ratings" },
  { title: translate["shared.header.links.store.value"](), icon: "sprite:basket", label: translate["shared.header.links.store.value"](), href: "/store" },
  { title: translate["shared.header.links.map.value"](), icon: "sprite:map", label: translate["shared.header.links.map.value"](), href: "/map" },
  { title: translate["shared.header.links.lands.value"](), icon: "sprite:mountain", label: translate["shared.header.links.lands.value"](), href: "/lands" }
]

export type MenuLink = {
  title: string,
  type: "default" | "privated",
  permission?: string,
  href: string
}
export const createHeaderMenuLinks = (): MenuLink[] => [
  { title: translate["shared.header.menu.cart"](), type: "default", href: "/store/cart", },
  { title: translate["shared.header.menu.orders"](), type: "default", href: "/store/cart/orders", },
  { title: translate["shared.header.menu.tasks"](), type: "default", href: "/tasks", },
  { title: translate["shared.header.menu.referrals"](), type: "default", href: "/referrals", },
  { title: translate["shared.header.menu.private"](), permission: CONFIG_PANEL_READ_PERMISSION, type: "privated", href: "/private", }
];

export const validatedLinksAtom = atom((ctx) => {
  const perms = ctx.get(currentUserState.perms)

  const validatedLinks = createHeaderMenuLinks().filter(s => {
    if (s.type === 'privated' && s.permission) {
      return perms.includes(s.permission)
    }
    return true
  })

  return validatedLinks
})

export type MenuActionItem = {
  cb: Action<[], void>;
  label: string;
  className?: string;
  disabled?: (ctx: CtxSpy) => boolean;
};
export const createMenuActions = (): MenuActionItem[] => [
  {
    label: translate["shared.header.menu.settings"](),
    cb: action((ctx) => void settingsState.isOpen(ctx, true)),
  },
  {
    label: translate["shared.header.menu.logout"](),
    className: "text-red hover:bg-red/60!",
    disabled: (ctx) => ctx.spy(logout.exec.statusesAtom).isPending,
    cb: logout.withConfirm,
  },
]

export const showCurrentUserMenuAtom = atom((ctx) => ctx.spy(userState.isAuthed) && ctx.spy(pageState.urlPathname) !== "/auth")
export const showCartIconAtom = atom((ctx) => ctx.spy(userState.isAuthed) && ctx.spy(pageState.urlPathname)?.includes("/store"))
export const showAuthorizeButtonAtom = atom((ctx) => !ctx.spy(userState.isAuthed) && ctx.spy(pageState.urlPathname) !== "/auth");

export const headerUserMenuIsOpenAtom = atom(false, "headerUserMenuIsOpen")
