import { action, atom, withAssign } from "@reatom/framework"
import { createStorageModel as createBaseStorageModel } from "@projectfasberry/storage"
import { taurusStorageApi } from "@/shared/api/storage"

/**
 * Bucket browser used by the site editor. The model comes from
 * `@projectfasberry/storage`; the view is ours because that package ships a
 * React binding only.
 */
export const {
  storage: assetStorage,
  storageState: assetStorageState,
} = createBaseStorageModel({ name: "assets", api: taurusStorageApi })

/** Which editor field the picker will fill when the user chooses a file. */
type AssetTarget =
  | { kind: "server"; id: string }
  | { kind: "slide"; index: number }
  | { kind: "feature"; serverId: string; index: number }

export const assetPickerTarget = atom<AssetTarget | null>(null, "assetPicker.target")

export const assetPicker = atom(null, "assetPicker").pipe(
  withAssign((_, name) => ({
    search: atom("", `${name}.search`),
  })),
)

export const openAssetPicker = action((ctx, target: AssetTarget) => {
  assetPicker.search(ctx, "")
  assetPickerTarget(ctx, target)
}, "openAssetPicker")

export const closeAssetPicker = action((ctx) => {
  assetPickerTarget(ctx, null)
}, "closeAssetPicker")

export const setAssetSearch = action((ctx, value: string) => {
  assetPicker.search(ctx, value)
}, "setAssetSearch")
