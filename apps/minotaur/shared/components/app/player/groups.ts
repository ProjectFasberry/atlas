/**
 * LuckPerms groups shown on the player profile.
 *
 * The API returns `group: string`, so this registry is the single UI source of
 * truth for labels, colors and order. Keep colors in sync with
 * `pkgs/shared/constants/donate-aliases.ts` in aether.
 */
export const PLAYER_GROUPS = {
  default: { label: "player.groups.default", color: "#ffffff", priority: 0, kind: "default" },
  loyal: { label: "player.groups.loyal", color: "#40c983", priority: 20, kind: "donate" },
  authentic: { label: "player.groups.authentic", color: "#e342cd", priority: 30, kind: "donate" },
  testers: { label: "player.groups.testers", color: "#3b82f6", priority: 40, kind: "staff" },
  helper: { label: "player.groups.helper", color: "#3d3d3d", priority: 50, kind: "staff" },
  dev: { label: "player.groups.dev", color: "#a1a1a1", priority: 60, kind: "staff" },
  moder: { label: "player.groups.moder", color: "#6452d9", priority: 70, kind: "staff" },
  arkhont: { label: "player.groups.arkhont", color: "#30ff5d", priority: 80, kind: "staff" },
} as const

export type PlayerGroup = keyof typeof PLAYER_GROUPS
export type PlayerGroupMeta = (typeof PLAYER_GROUPS)[PlayerGroup]

export const UNKNOWN_PLAYER_GROUP_COLOR = "#6b7280"

const normalize = (value: string) => value.trim().toLowerCase()

export const isPlayerGroup = (value: string): value is PlayerGroup =>
  Object.hasOwn(PLAYER_GROUPS, normalize(value))

export const getPlayerGroupMeta = (value: string): PlayerGroupMeta | null =>
  isPlayerGroup(value) ? PLAYER_GROUPS[normalize(value) as PlayerGroup] : null

/** Drops duplicates and empty values while keeping unknown groups. */
export function buildPlayerTags(...groups: (string | null | undefined)[]): string[] {
  const normalized = groups
    .filter((group): group is string => Boolean(group?.trim()))
    .map(normalize)

  return Array.from(new Set(normalized))
}

/** Staff and donate groups first, unknown groups last. */
export function sortPlayerGroups(groups: string[]): string[] {
  const priority = (group: string) => getPlayerGroupMeta(group)?.priority ?? -1

  return buildPlayerTags(...groups).sort((a, b) => {
    const diff = priority(b) - priority(a)

    return diff || a.localeCompare(b)
  })
}
