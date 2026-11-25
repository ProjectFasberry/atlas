import { currentUserState } from "@/shared/models/current-user/index.model";
import { translate } from "@/shared/locales/helpers";
import type { IconName } from "@/shared/ui/icon";
import { action, atom, withAssign } from "@reatom/framework";
import dayjs from "dayjs";
import {
  CONFIG_PANEL_READ_PERMISSION,
  ECONOMY_READ_PERMISSION,
  HISTORY_READ_PERMISSION,
  CONTENT_READ_PERMISSION,
  RULES_READ_PERMISSION,
  METRICS_READ_PERMISSION,
  PLAYERS_READ_PERMISSION,
  RELEASES_READ_PERMISSION,
  ANTICHEAT_READ_PERMISSION,
  SERVERS_READ_PERMISSION,
  TEAM_APPLICATIONS_READ_PERMISSION,
  STORE_ITEM_READ_PERMISSION,
  API_KEYS_LIST_PERMISSION,
  LANDS_READ_PERMISSION,
  OPTIONS_READ_PERMISSION,
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

const NAMESPACE_KEYS: Record<string, string> = {
  api: "private.permissions.namespaces.api",
  banners: "private.permissions.namespaces.banners",
  dictionaries: "private.permissions.namespaces.dictionaries",
  economy: "private.permissions.namespaces.economy",
  events: "private.permissions.namespaces.events",
  history: "private.permissions.namespaces.history",
  lands: "private.permissions.namespaces.lands",
  metrics: "private.permissions.namespaces.metrics",
  modpacks: "private.permissions.namespaces.modpacks",
  news: "private.permissions.namespaces.news",
  options: "private.permissions.namespaces.options",
  permissions: "private.permissions.namespaces.permissions",
  players: "private.permissions.namespaces.players",
  releases: "private.permissions.namespaces.releases",
  roles: "private.permissions.namespaces.roles",
  servers: "private.permissions.namespaces.servers",
  skins: "private.permissions.namespaces.skins",
  store: "private.permissions.namespaces.store",
  team: "private.permissions.namespaces.team",
  volume: "private.permissions.namespaces.volume",
}

const NAMESPACE_ORDER = [
  "players", "store", "economy", "lands", "skins", "news", "events",
  "team", "servers", "releases", "modpacks", "banners", "dictionaries",
  "roles", "permissions", "metrics", "history", "options", "api", "tasks", "volume",
]

const translateKey = (key: string | undefined, fallback: string): string => {
  if (!key) return fallback

  const message = (translate as unknown as Record<string, (() => string) | undefined>)[key]
  return message?.() ?? fallback
}
const PERMISSION_KEYS: Record<string, string> = {
  "api.keys.control": "private.permissions.titles.api.keys.control",
  "api.keys.list": "private.permissions.titles.api.keys.list",
  "banners.create": "private.permissions.titles.banners.create",
  "banners.delete": "private.permissions.titles.banners.delete",
  "dictionaries.create": "private.permissions.titles.dictionaries.create",
  "dictionaries.delete": "private.permissions.titles.dictionaries.delete",
  "dictionaries.read": "private.permissions.titles.dictionaries.read",
  "dictionaries.update": "private.permissions.titles.dictionaries.update",
  "economy.read": "private.permissions.titles.economy.read",
  "economy.write": "private.permissions.titles.economy.write",
  "events.create": "private.permissions.titles.events.create",
  "events.delete": "private.permissions.titles.events.delete",
  "history.read": "private.permissions.titles.history.read",
  "lands.create": "private.permissions.titles.lands.create",
  "lands.delete": "private.permissions.titles.lands.delete",
  "lands.read": "private.permissions.titles.lands.read",
  "metrics.read": "private.permissions.titles.metrics.read",
  "modpacks.create": "private.permissions.titles.modpacks.create",
  "modpacks.delete": "private.permissions.titles.modpacks.delete",
  "news.create": "private.permissions.titles.news.create",
  "news.delete": "private.permissions.titles.news.delete",
  "news.update": "private.permissions.titles.news.update",
  "options.read": "private.permissions.titles.options.read",
  "options.update": "private.permissions.titles.options.update",
  "permissions.read": "private.permissions.titles.permissions.read",
  "players.auth": "private.permissions.titles.players.auth",
  "players.permission.update": "private.permissions.titles.players.permission.update",
  "players.read": "private.permissions.titles.players.read",
  "players.restrict.create": "private.permissions.titles.players.restrict.create",
  "players.restrict.delete": "private.permissions.titles.players.restrict.delete",
  "players.role.update": "private.permissions.titles.players.role.update",
  "releases.read": "private.permissions.titles.releases.read",
  "roles.read": "private.permissions.titles.roles.read",
  "roles.update": "private.permissions.titles.roles.update",
  "servers.read": "private.permissions.titles.servers.read",
  "servers.update": "private.permissions.titles.servers.update",
  "skins.moderate": "private.permissions.titles.skins.moderate",
  "store.item.create": "private.permissions.titles.store.item.create",
  "store.item.delete": "private.permissions.titles.store.item.delete",
  "store.item.update": "private.permissions.titles.store.item.update",
  "store.methods.read": "private.permissions.titles.store.methods.read",
  "store.methods.update": "private.permissions.titles.store.methods.update",
  "tasks.create": "private.permissions.titles.tasks.create",
  "tasks.delete": "private.permissions.titles.tasks.delete",
  "tasks.read": "private.permissions.titles.tasks.read",
  "tasks.update": "private.permissions.titles.tasks.update",
  "team.applications.read": "private.permissions.titles.team.applications.read",
  "team.applications.update": "private.permissions.titles.team.applications.update",
  "volume.control": "private.permissions.titles.volume.control",
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
    title: translateKey(PERMISSION_KEYS[name], name),
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
      title: translateKey(NAMESPACE_KEYS[key], key),
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
  { title: translate["panel.configuration"](), value: "/private/", permissions: [CONFIG_PANEL_READ_PERMISSION], icon: "sprite:settings" },
  { title: translate["panel.content"](), value: "/private/content", permissions: ["news.create", "news.update", "news.delete", "banners.create", "banners.delete", "events.create", "events.delete", "modpacks.create", "modpacks.delete", "tasks.create", "tasks.update", "tasks.delete", LANDS_READ_PERMISSION, RULES_READ_PERMISSION], icon: "sprite:category" },
  { title: translate["panel.site"](), value: "/private/site", permissions: [CONTENT_READ_PERMISSION], icon: "sprite:device-desktop" },
  { title: translate["panel.store"](), value: "/private/store", permissions: [STORE_ITEM_READ_PERMISSION], icon: "sprite:building-store" },
  { title: translate["panel.player"](), value: "/private/users", permissions: [PLAYERS_READ_PERMISSION], icon: "sprite:user-circle" },
  { title: translate["panel.moderation"](), value: "/private/moderation", permissions: [TEAM_APPLICATIONS_READ_PERMISSION, HISTORY_READ_PERMISSION], icon: "sprite:shield-half" },
  { title: translate["panel.anticheat"](), value: "/private/anticheat", permissions: [ANTICHEAT_READ_PERMISSION], icon: "sprite:shield-half" },
  { title: translate["panel.releases"](), value: "/private/releases", permissions: [RELEASES_READ_PERMISSION], icon: "sprite:download" },
  { title: translate["panel.analytics"](), value: "/private/analytics", permissions: [METRICS_READ_PERMISSION], icon: "sprite:aspect-ratio" },
  { title: translate["panel.socials"](), value: "/private/socials", permissions: [OPTIONS_READ_PERMISSION], icon: "sprite:language" },
  { title: translate["panel.economy"](), value: "/private/economy", permissions: [ECONOMY_READ_PERMISSION], icon: "sprite:credit-card-pay" },
  { title: translate["panel.api-keys"](), value: "/private/api-keys", permissions: [API_KEYS_LIST_PERMISSION], icon: "sprite:lock" },
]
