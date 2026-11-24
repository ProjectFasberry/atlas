import { action, atom, withAssign } from "@reatom/framework"

/**
 * Whether the editor wants to see the draft. Local to the browser, so the page
 * itself always renders published content and nothing depends on a query flag.
 */
const STORAGE_KEY = "fasberry:site-edit"

export const siteEditMode = atom(null, "siteEditMode").pipe(
  withAssign((_, name) => ({
    active: atom(false, `${name}.active`),
  })),
)

const persist = (value: boolean) => {
  if (typeof window === "undefined") return

  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0")
  } catch {
    // Private mode and blocked storage: the in-memory flag still works.
  }
}

export const hydrateSiteEditMode = action((ctx) => {
  if (typeof window === "undefined") return

  let stored = false

  try {
    stored = window.localStorage.getItem(STORAGE_KEY) === "1"
  } catch {
    stored = false
  }

  siteEditMode.active(ctx, stored)
}, "siteEditMode.hydrate")

export const setSiteEditMode = action((ctx, value: boolean) => {
  siteEditMode.active(ctx, value)
  persist(value)
}, "siteEditMode.set")

export const toggleSiteEditMode = action((ctx) => {
  const next = !ctx.get(siteEditMode.active)

  siteEditMode.active(ctx, next)
  persist(next)
}, "siteEditMode.toggle")
