import { isError } from "@/shared/lib/utils";
import { action, atom, isDeepEqual, withAssign } from "@reatom/framework"
import { navigate } from "vike/client/router";
import { toast } from "sonner";
import { pageState } from "@/shared/models/page-context.model";

const PARENTS = ["news", "banner", "event", "dictionaries", "modpack", "lands", "api"] as const
const TYPES = ["create", "edit", "view"] as const;

export type ActionParent = typeof PARENTS[number]
export type ActionType = typeof TYPES[number]

/** Config panel route. Sections and modes only exist as query params on it. */
export const PANEL_PATH = "/private"

const isParent = (value: unknown): value is ActionParent =>
  PARENTS.includes(value as ActionParent)

const isType = (value: unknown): value is ActionType =>
  TYPES.includes(value as ActionType)

/**
 * The URL is the only source of truth for the open section and mode. Deriving
 * instead of mirroring keeps deep links, reload, back/forward and the
 * post-submit redirect in agreement for free.
 */
export const actionsState = atom(null, "actionsState").pipe(
  withAssign((_, name) => ({
    parent: atom((ctx): ActionParent | null => {
      const value = ctx.spy(pageState.urlParsed)?.search?.parent
      return isParent(value) ? value : null
    }, `${name}.parent`),
    type: atom((ctx): ActionType => {
      const value = ctx.spy(pageState.urlParsed)?.search?.type
      return isType(value) ? value : "view"
    }, `${name}.type`),
    target: atom((ctx): string | null => {
      const value = ctx.spy(pageState.urlParsed)?.search?.target
      return typeof value === "string" && value.trim().length > 0 ? value.trim() : null
    }, `${name}.target`),
  }))
)

export type ConfigLinkParams = {
  parent: ActionParent
  type: ActionType
  target?: string | number | null
}

/** Pure panel URL for a section mode; the only place that encodes the params. */
export const configLink = ({ parent, type, target }: ConfigLinkParams): string => {
  const search = new URLSearchParams({ parent, type })
  const targetValue = target === null || target === undefined ? "" : String(target).trim()

  if (type === "edit" && targetValue.length > 0) {
    search.set("target", targetValue)
  }

  return `${PANEL_PATH}?${search.toString()}`
}

const go = (url: string) => {
  void navigate(url).catch(() => {})
}

export const actions = atom(null, "actions").pipe(
  withAssign((_, name) => ({
    open: action((ctx, params: ConfigLinkParams) => {
      const url = configLink(params)
      ctx.schedule(() => go(url))
    }, `${name}.open`),
    goBack: action((ctx) => {
      const url = ctx.get(pageState.urlPathname)
      ctx.schedule(() => go(url))
    }, `${name}.goBack`),
  }))
)

export const getSelectedParentAtom = (parent: ActionParent) => atom((ctx) => ctx.spy(actionsState.parent) === parent)

export const getIsSelectedActionAtom = (targetParent: ActionParent, targetType: ActionType) => atom((ctx) =>
  (ctx.spy(actionsState.parent) === targetParent) && (ctx.spy(actionsState.type) === targetType)
)

const ERRORS_MAP: Record<string, string> = {
  "RESTRICTED_BY_ROLE": "Действие недоступно из-за политики ролей",
  "NULL": "Произошла ошибка"
}

export function notifyAboutRestrictRole(e: unknown, { withToast = true } = {}) {
  if (!isError(e)) return;

  if (e.message) {
    const message = ERRORS_MAP[e.message] ?? ERRORS_MAP["NULL"]

    if (withToast) {
      toast.error(message, {
        description: import.meta.env.DEV ? e.message : undefined
      })
    } else {
      console.error(message)
    }
  }
}

export const compareChanges = (actual: Record<string, string | null>, old: Record<string, string | null>) => {
  return Object.keys(actual).some((key) => {
    const value = actual[key]
    let oldValue = old[key]

    const hasInput =
      value === null || value === undefined
        ? false
        : typeof value === 'string'
          ? value.trim().length > 0
          : Boolean(value)

    let unchanged = false

    if (typeof value === 'string' && typeof oldValue === 'string') {
      unchanged = value === oldValue
    } else if (value && oldValue) {
      unchanged = isDeepEqual(value, oldValue)
    } else {
      unchanged = value === oldValue
    }

    return hasInput && !unchanged
  })
}

export const collectChanges = (actual: Record<string, any>, old: Record<string, any>) => {
  const changes: Record<string, any> = {}

  for (const key of Object.keys(actual)) {
    const value = actual[key]
    const oldValue = old[key]

    const isDifferent =
      typeof value === 'object' && value !== null && oldValue !== null
        ? !isDeepEqual(value, oldValue)
        : value !== oldValue

    const hasInput =
      value !== null && value !== undefined &&
      (typeof value !== 'string' || value.trim().length > 0)

    if (hasInput && isDifferent) changes[key] = value
  }

  return changes
}
