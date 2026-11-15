import { atom } from "@reatom/framework"
import { withSearchParamsPersist } from "@reatom/url"

export type PanelTab<T extends string = string> = {
  value: T
  title: string
  /** Any of these permissions grants access; omitted means everyone with the page guard. */
  permissions?: string[]
}

export const hasTabAccess = (tab: PanelTab, permissions: string[]) =>
  !tab.permissions || tab.permissions.some((permission) => permissions.includes(permission))

/** `?tab=` keeps a deep link to one tab; unknown values fall back to the first one. */
export const createTabAtom = <T extends string>(
  name: string,
  tabs: readonly PanelTab<T>[],
  fallback: T,
) => atom<T>(fallback, name).pipe(
  withSearchParamsPersist("tab", (value = fallback) => (
    tabs.some((tab) => tab.value === value) ? value as T : fallback
  )),
)
