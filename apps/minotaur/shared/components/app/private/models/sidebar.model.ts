import { currentUserState } from "@/shared/models/current-user/index.model";
import type { IconName } from "@/shared/ui/icon";
import { action, atom, withAssign } from "@reatom/framework";
import dayjs from "dayjs";
import {
  CONFIG_PANEL_READ_PERMISSION,
  ECONOMY_READ_PERMISSION,
  HISTORY_READ_PERMISSION,
  METRICS_READ_PERMISSION,
  PLAYERS_READ_PERMISSION,
  RELEASES_READ_PERMISSION,
  SERVERS_READ_PERMISSION,
  TEAM_APPLICATIONS_READ_PERMISSION,
  STORE_ITEM_READ_PERMISSION,
} from "@/shared/consts/permissions";

export type Perms = {
  read: string[], create: string[], update: string[], delete: string[], unknown: string[],
}

export const sidebar = atom(null).pipe(
  withAssign((_, name) => ({
    infoIsOpened: atom(false, `${name}.infoIsOpened`),
    isCollapsed: atom(false, `${name}.isCollapsed`)
  }))
)

export const toggleSidebar = action((ctx) => {
  sidebar.isCollapsed(ctx, (collapsed) => !collapsed)
}, "toggleSidebar")

const permsAtom = atom<Perms>({
  read: [], create: [], update: [], delete: [], unknown: [],
});

export const transformPermsByNamespace = action((ctx) => {
  const targets = ctx.get(currentUserState.perms);
  if (!targets) return null;

  permsAtom(ctx, {
    read: targets.filter(t => t.endsWith(".read")),
    create: targets.filter(t => t.endsWith(".create")),
    update: targets.filter(t => t.endsWith(".update")),
    delete: targets.filter(t => t.endsWith(".delete")),
    unknown: targets.filter(
      t => !/\.(read|create|update|delete)$/.test(t)
    ),
  });
})

const sortPerms = (items: string[]) => [...items].sort((a, b) => a.localeCompare(b))

export const groupsAtom = atom((ctx) => {
  const perms = ctx.spy(permsAtom)

  return [
    { title: "Чтение", data: sortPerms(perms.read) },
    { title: "Создание", data: sortPerms(perms.create) },
    { title: "Изменение", data: sortPerms(perms.update) },
    { title: "Удаление", data: sortPerms(perms.delete) },
    { title: "Прочее", data: sortPerms(perms.unknown) },
  ].filter(g => g.data && g.data.length > 0);
})

export function formatAccountDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "—";

  const date = dayjs(value);
  return date.isValid() ? date.format("DD.MM.YYYY") : "—";
}

export type SidebarLink = { title: string, value: string, permission: string, icon: IconName }

export const sidebarLinks: SidebarLink[] = [
  { title: "Конфигурация", value: "/private/", permission: CONFIG_PANEL_READ_PERMISSION, icon: "sprite:settings" },
  { title: "Магазин", value: "/private/store", permission: STORE_ITEM_READ_PERMISSION, icon: "sprite:building-store" },
  { title: "Игрок", value: "/private/users", permission: PLAYERS_READ_PERMISSION, icon: "sprite:user-circle" },
  { title: "История", value: "/private/history", permission: HISTORY_READ_PERMISSION, icon: "sprite:book" },
  { title: "Релизы", value: "/private/releases", permission: RELEASES_READ_PERMISSION, icon: "sprite:download" },
  { title: "Серверы", value: "/private/servers", permission: SERVERS_READ_PERMISSION, icon: "sprite:device-desktop" },
  { title: "Метрики", value: "/private/metrics", permission: METRICS_READ_PERMISSION, icon: "sprite:aspect-ratio" },
  { title: "Экономика", value: "/private/economy", permission: ECONOMY_READ_PERMISSION, icon: "sprite:credit-card-pay" },
  { title: "Команда", value: "/private/team", permission: TEAM_APPLICATIONS_READ_PERMISSION, icon: "sprite:stars" },
]
