import { atom, withAssign } from "@reatom/framework"
import { withLocalStorage } from "@reatom/persist-web-storage"

export type StoreView = "grid" | "list"

export const STORE_VIEWS: StoreView[] = ["grid", "list"]

export const isStoreView = (value: unknown): value is StoreView =>
  value === "grid" || value === "list"

/**
 * Web-only preferences. The atoms that change SSR markup are read behind
 * `pageState.isClientside`, so the server keeps rendering the defaults.
 */
export const appearanceState = atom(null, "appearanceState").pipe(
  withAssign((_, name) => ({
    reduceMotion: atom(false, `${name}.reduceMotion`).pipe(
      withLocalStorage({ key: "appearance-reduce-motion" })
    ),
    soundsEnabled: atom(true, `${name}.soundsEnabled`).pipe(
      withLocalStorage({ key: "appearance-sounds" })
    ),
    hideHeaderBalance: atom(false, `${name}.hideHeaderBalance`).pipe(
      withLocalStorage({ key: "appearance-hide-header-balance" })
    ),
    staticSkin: atom(false, `${name}.staticSkin`).pipe(
      withLocalStorage({ key: "appearance-static-skin" })
    ),
    storeView: atom<StoreView>("grid", `${name}.storeView`).pipe(
      withLocalStorage({ key: "appearance-store-view" })
    )
  }))
)
