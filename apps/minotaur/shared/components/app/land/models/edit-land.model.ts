import { logError } from "@/shared/lib/log"
import { translate } from "@/shared/locales/helpers"
import { reatomAsync, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { action, atom } from "@reatom/framework"
import { withAssign, withReset } from "@reatom/framework"
import { toast } from "sonner"

type NewLandChangesKeys = "banner" | "gallery"

export const landEditingState = atom(null, "landEditingState").pipe(
  withAssign((_, name) => ({
    // Modes:
    // 0 - view, 1 - editing
    mode: atom<0 | 1>(0, `${name}.mode`).pipe(withReset()),
    personalization: atom(null, `${name}.personalization`).pipe(
      withAssign((_, name) => ({
        bannerUrl: atom("", `${name}.bannerUrl`).pipe(withReset()),
        galleryUrls: atom<string[]>([], `${name}.galleryUrls`).pipe(withReset())
      }))
    ),
    changes: atom<Record<NewLandChangesKeys | string, string[]>>({}, `${name}.changes`).pipe(withReset())
  }))
)

export const landEditing = atom(null, "landEditing").pipe(
  withAssign((_, name) => ({
    resetFull: action((ctx) => {
      landEditingState.mode.reset(ctx)
      landEditingState.changes.reset(ctx)
      landEditingState.personalization.galleryUrls.reset(ctx)
      landEditingState.personalization.bannerUrl.reset(ctx)
    }),
    banner: atom(null, `${name}.banner`).pipe(
      withAssign((_, name) => ({
        apply: action((ctx, e: React.FormEvent<HTMLInputElement>) => {
          const value = e.currentTarget.files ? e.currentTarget.files[0] : null

          if (value) {
            const url = URL.createObjectURL(value)
            landEditingState.changes(ctx, (state) => ({ ...state, "banner": [url] }))
          }
        }, `${name}.apply`)
      }))
    ),
    submit: reatomAsync(async (ctx) => {
      const isChanges = ctx.get(changesIsExistsAtom)
      if (!isChanges) return null;

      toast.warning(translate["land.test.not-impl"]())
      return null;
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        if (!res) return;

        landEditing.resetFull(ctx)
      },
      onReject: (_, e) => {
        logError(e, { type: "combined" })
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const changesIsExistsAtom = atom<boolean>((ctx) => {
  const state: Record<string, string[]> = ctx.spy(landEditingState.changes);
  return Object.values(state).some(arr => arr.length > 0);
}, "changesIsExist")

landEditingState.changes.onChange((ctx, state) => {
  const keys = Object.keys(state)

  if (keys.includes("banner")) {
    landEditingState.personalization.bannerUrl(ctx, state["banner"][0])
  }

  if (keys.includes("gallery")) {
    landEditingState.personalization.galleryUrls(ctx, state["gallery"])
  }
})

export const landActionTitleAtom = atom((ctx) => ctx.spy(landEditingState.mode) === 0
  ? translate["land.edit"]() : translate["land.view"]()
)

export const bannerEditIsAllowedAtom = atom((ctx) => {
  const isEditMode = ctx.spy(landEditingState.mode) === 1
  const newBannerIsExist = ctx.spy(landEditingState.personalization.bannerUrl)
  return isEditMode && !newBannerIsExist
})
