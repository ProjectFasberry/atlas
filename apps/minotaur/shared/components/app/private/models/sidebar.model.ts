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
  API_KEYS_LIST_PERMISSION,
  LANDS_READ_PERMISSION,
} from "@/shared/consts/permissions";

export const sidebar = atom(null).pipe(
  withAssign((_, name) => ({
    infoIsOpened: atom(false, `${name}.infoIsOpened`),
    isCollapsed: atom(false, `${name}.isCollapsed`)
  }))
)

export const toggleSidebar = action((ctx) => {
  sidebar.isCollapsed(ctx, (collapsed) => !collapsed)
}, "toggleSidebar")

export type PermissionItem = {
  name: string
  title: string
  danger: boolean
}

export type PermissionGroup = {
  key: string
  title: string
  items: PermissionItem[]
}

const NAMESPACE_TITLES: Record<string, string> = {
  api: "API",
  banners: "Баннеры",
  dictionaries: "Словари",
  economy: "Экономика",
  events: "События",
  history: "История",
  lands: "Регионы",
  metrics: "Метрики",
  modpacks: "Модпаки",
  news: "Новости",
  options: "Настройки",
  permissions: "Права",
  players: "Игроки",
  releases: "Релизы",
  roles: "Роли",
  servers: "Серверы",
  skins: "Скины",
  store: "Магазин",
  team: "Команда",
  volume: "Файлы",
}

const NAMESPACE_ORDER = [
  "players", "store", "economy", "lands", "skins", "news", "events",
  "team", "servers", "releases", "modpacks", "banners", "dictionaries",
  "roles", "permissions", "metrics", "history", "options", "api", "tasks", "volume",
]

const PERMISSION_TITLES: Record<string, string> = {
  "api.keys.control": "Управление API-ключами",
  "api.keys.list": "Просмотр API-ключей",
  "banners.create": "Создание баннеров",
  "banners.delete": "Удаление баннеров",
  "dictionaries.create": "Создание словарей",
  "dictionaries.delete": "Удаление словарей",
  "dictionaries.read": "Просмотр словарей",
  "dictionaries.update": "Изменение словарей",
  "economy.read": "Просмотр экономики",
  "economy.write": "Изменение экономики",
  "events.create": "Создание событий",
  "events.delete": "Удаление событий",
  "history.read": "Просмотр истории",
  "lands.create": "Создание регионов",
  "lands.delete": "Удаление регионов",
  "lands.read": "Просмотр регионов",
  "metrics.read": "Просмотр метрик",
  "modpacks.create": "Создание модпаков",
  "modpacks.delete": "Удаление модпаков",
  "news.create": "Создание новостей",
  "news.delete": "Удаление новостей",
  "news.update": "Изменение новостей",
  "options.read": "Просмотр настроек",
  "options.update": "Изменение настроек",
  "permissions.read": "Просмотр прав",
  "players.auth": "Авторизация игроков",
  "players.permission.update": "Выдача прав игрокам",
  "players.read": "Просмотр игроков",
  "players.restrict.create": "Выдача ограничений",
  "players.restrict.delete": "Снятие ограничений",
  "players.role.update": "Смена роли игрока",
  "releases.read": "Просмотр релизов",
  "roles.read": "Просмотр ролей",
  "roles.update": "Изменение ролей",
  "servers.read": "Просмотр серверов",
  "servers.update": "Изменение серверов",
  "skins.moderate": "Модерация скинов",
  "store.item.create": "Создание товаров",
  "store.item.delete": "Удаление товаров",
  "store.item.update": "Изменение товаров",
  "store.methods.read": "Просмотр методов оплаты",
  "store.methods.update": "Изменение методов оплаты",
  "tasks.create": "Создание заданий",
  "tasks.delete": "Удаление заданий",
  "tasks.read": "Просмотр заданий",
  "tasks.update": "Изменение заданий",
  "team.applications.read": "Просмотр заявок",
  "team.applications.update": "Обработка заявок",
  "volume.control": "Управление файлами",
}

const DANGEROUS_PERMISSIONS = new Set([
  "economy.write",
  "players.auth",
  "players.permission.update",
  "players.role.update",
  "roles.update",
])

const isDangerous = (name: string) =>
  DANGEROUS_PERMISSIONS.has(name) || name.endsWith(".delete")

export const permissionSearch = atom("", "permissionSearch")
export const permissionCopied = atom(false, "permissionCopied")

const permissionItems = (perms: string[]): PermissionItem[] =>
  perms.map((name) => ({
    name,
    title: PERMISSION_TITLES[name] ?? name,
    danger: isDangerous(name),
  }))

/** Permissions grouped by namespace, filtered by the search box. */
export const permissionGroupsAtom = atom((ctx): PermissionGroup[] => {
  const perms = ctx.spy(currentUserState.perms) ?? []
  const search = ctx.spy(permissionSearch).trim().toLowerCase()

  const filtered = permissionItems(perms).filter((item) =>
    !search
    || item.name.toLowerCase().includes(search)
    || item.title.toLowerCase().includes(search)
  )

  const byNamespace = new Map<string, PermissionItem[]>()
  for (const item of filtered) {
    const namespace = item.name.split(".")[0] ?? "other"
    const bucket = byNamespace.get(namespace) ?? []
    bucket.push(item)
    byNamespace.set(namespace, bucket)
  }

  return [...byNamespace.entries()]
    .map(([key, items]) => ({
      key,
      title: NAMESPACE_TITLES[key] ?? key,
      items: items.sort((a, b) => a.title.localeCompare(b.title, "ru")),
    }))
    .sort((a, b) => {
      const ai = NAMESPACE_ORDER.indexOf(a.key)
      const bi = NAMESPACE_ORDER.indexOf(b.key)

      return (ai === -1 ? NAMESPACE_ORDER.length : ai)
        - (bi === -1 ? NAMESPACE_ORDER.length : bi)
        || a.title.localeCompare(b.title, "ru")
    })
})

export const permissionCountAtom = atom((ctx) =>
  (ctx.spy(currentUserState.perms) ?? []).length, "permissionCount")

export const permissionFilteredCountAtom = atom((ctx) =>
  ctx.spy(permissionGroupsAtom).reduce((sum, group) => sum + group.items.length, 0),
"permissionFilteredCount")

let copiedTimer: ReturnType<typeof setTimeout> | null = null

export const copyPermissions = action((ctx) => {
  const names = ctx.get(permissionGroupsAtom)
    .flatMap((group) => group.items.map((item) => item.name))

  if (!names.length || typeof navigator === "undefined") return

  void navigator.clipboard.writeText(names.join("\n")).then(() => {
    permissionCopied(ctx, true)
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => permissionCopied(ctx, false), 1500)
  })
}, "copyPermissions")

export function formatAccountDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return "—";

  const date = dayjs(value);
  return date.isValid() ? date.format("DD.MM.YYYY") : "—";
}

export type SidebarLink = { title: string, value: string, permissions: string[], icon: IconName }

export const sidebarLinks: SidebarLink[] = [
  { title: "Конфигурация", value: "/private/", permissions: [CONFIG_PANEL_READ_PERMISSION], icon: "sprite:settings" },
  { title: "Контент", value: "/private/content", permissions: ["news.create", "news.update", "news.delete", "banners.create", "banners.delete", "events.create", "events.delete", "modpacks.create", "modpacks.delete", "tasks.create", "tasks.update", "tasks.delete", LANDS_READ_PERMISSION], icon: "sprite:category" },
  { title: "Магазин", value: "/private/store", permissions: [STORE_ITEM_READ_PERMISSION], icon: "sprite:building-store" },
  { title: "Игрок", value: "/private/users", permissions: [PLAYERS_READ_PERMISSION], icon: "sprite:user-circle" },
  { title: "Модерация", value: "/private/moderation", permissions: [TEAM_APPLICATIONS_READ_PERMISSION, HISTORY_READ_PERMISSION], icon: "sprite:shield-half" },
  { title: "Релизы", value: "/private/releases", permissions: [RELEASES_READ_PERMISSION], icon: "sprite:download" },
  { title: "Аналитика", value: "/private/analytics", permissions: [METRICS_READ_PERMISSION], icon: "sprite:aspect-ratio" },
  { title: "Экономика", value: "/private/economy", permissions: [ECONOMY_READ_PERMISSION], icon: "sprite:credit-card-pay" },
  { title: "API-ключи", value: "/private/api-keys", permissions: [API_KEYS_LIST_PERMISSION], icon: "sprite:lock" },
]
