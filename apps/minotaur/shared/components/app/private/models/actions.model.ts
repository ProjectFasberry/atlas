import { isError } from "@/shared/lib/utils";
import { action, atom, withAssign, type AtomState } from "@reatom/framework"
import { isDeepEqual, reatomRecord, withReset } from "@reatom/framework"
import { toast } from "sonner";

const PARENTS = ["news", "banner", "event", "dictionaries", "modpack", "lands", "api"] as const
const TYPES = ["create", "edit", "view"] as const;

export type ActionParent = typeof PARENTS[number]
export type ActionType = typeof TYPES[number]

export const actionsState = atom(null, "actionsState").pipe(
  withAssign((_, name) => ({
    searchParams: reatomRecord<Record<string, string>>({}, `${name}.searchParams`).pipe(withReset()),
    parent: atom<ActionParent | null>(null, `${name}.parent`).pipe(withReset()),
    type: atom<ActionType>("view", `${name}.type`).pipe(withReset()),
    target: atom<Nullable<string>>(null, `${name}.target`).pipe(withReset()),
  }))
)
export const actions = atom(null, "actions").pipe(
  withAssign((_, name) => ({
    createLinkValue: action((ctx, params: CreateLinkParams) => {
      const url = new URL(window.location.href);
      const next = { ...ctx.get(actionsState.searchParams) }

      const parent = params.parent;
      const type = params.type;

      if (!parent || !type) throw new Error("Parent or type is not defined")
      if (!PARENTS.includes(parent)) throw new Error("Parent is not defined")
      if (!TYPES.includes(type)) throw new Error("Type is not defined")

      next.parent = parent
      url.searchParams.set('parent', parent)

      next.type = type
      url.searchParams.set('type', type)

      if (params.type === 'create') {
        delete next.target
        url.searchParams.delete('target')
      }

      if (params.type !== 'create' && params.target?.trim()) {
        next.target = params.target
        url.searchParams.set('target', params.target)
      }

      return { next, url }
    }, `${name}.createLinkValue`),
    createLink: action((ctx, params: CreateLinkParams) => {
      const { next, url } = actions.createLinkValue(ctx, params)

      actionsState.searchParams(ctx, next)
      window.history.pushState({}, '', url)
    }, `${name}.createLink`),
    goBack: action((ctx) => {
      const url = new URL(window.location.href)

      url.searchParams.delete('parent')
      url.searchParams.delete('type')
      url.searchParams.delete('target')

      window.history.pushState({}, '', url)

      actionsState.searchParams.reset(ctx)
      actionsState.parent.reset(ctx)
      actionsState.type.reset(ctx)
      actionsState.target.reset(ctx)
    }, `${name}.goBack`)
  }))
)

export const getIsSelectedActionAtom = (targetParent: ActionParent, targetType: ActionType) => atom((ctx) =>
  (ctx.spy(actionsState.parent) === targetParent) && (ctx.spy(actionsState.type) === targetType)
)

actionsState.searchParams.onChange((ctx, state) => {
  const { parent, type, target } = state

  if (!PARENTS.includes(parent as ActionParent) || !TYPES.includes(type as ActionType)) return;

  actionsState.parent(ctx, parent as ActionParent)
  actionsState.type(ctx, type as ActionType)

  if (type !== 'create') {
    if (target.trim().length >= 1) {
      actionsState.target(ctx, target)
    }
  } else {
    actionsState.target(ctx, null)
  }
})

type CreateLinkParams = {
  parent?: AtomState<typeof actionsState.parent>,
  type?: AtomState<typeof actionsState.type>,
  target?: string,
}

export const actionsCanGoBackAtom = (inputParent: AtomState<typeof actionsState.parent>) => atom((ctx) => {
  const state = ctx.spy(actionsState.searchParams);
  const { parent: currentParent, type, target } = state;

  const isThisParent = currentParent === inputParent
  if (!isThisParent) return false;

  const validParent = PARENTS.includes(currentParent)
  const validType = type === 'create' || type === 'edit' || type === 'view'
  const validTarget = type !== 'create' ? typeof target === 'string' && target.trim() !== '' : true

  const result = validParent && validType && validTarget
  return result
}, 'actionsCanGoBack')

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

export const getSelectedParentAtom = (parent: ActionParent) => atom((ctx) => ctx.spy(actionsState.parent) === parent)

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
