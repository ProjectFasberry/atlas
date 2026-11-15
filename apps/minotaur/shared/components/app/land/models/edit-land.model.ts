import { logError } from "@/shared/lib/log"
import { translate } from "@/shared/locales/helpers"
import { reatomAsync, withErrorAtom, withStatusesAtom } from "@reatom/framework"
import { action, atom } from "@reatom/framework"
import { withAssign, withReset } from "@reatom/framework"
import { toast } from "sonner"
import { client } from "@/shared/lib/client-wrapper"
import { env } from "@/shared/env"
import { landState } from "./land.model"

const LANDS_PREFIX = `${env.VITE_VOLUME_URL}/lands/`

/** The API stores keys; the land payload carries full volume URLs. */
export const toLandKey = (url: string) =>
  url.startsWith(LANDS_PREFIX) ? url.slice(LANDS_PREFIX.length) : url

export type PendingImage = { file: File, preview: string }

export const landEditingState = atom(null, "landEditingState").pipe(
  withAssign((_, name) => ({
    // Modes:
    // 0 - view, 1 - editing
    mode: atom<0 | 1>(0, `${name}.mode`).pipe(withReset()),
    title: atom("", `${name}.title`).pipe(withReset()),
    bannerFile: atom<Nullable<PendingImage>>(null, `${name}.bannerFile`),
    bannerRemoved: atom(false, `${name}.bannerRemoved`),
    galleryFiles: atom<PendingImage[]>([], `${name}.galleryFiles`),
    galleryRemoved: atom<string[]>([], `${name}.galleryRemoved`),
  }))
)

const resetFiles = action((ctx) => {
  landEditingState.bannerFile(ctx, null)
  landEditingState.bannerRemoved(ctx, false)
  landEditingState.galleryFiles(ctx, [])
  landEditingState.galleryRemoved(ctx, [])
}, "landEditing.resetFiles")

export const landEditing = atom(null, "landEditing").pipe(
  withAssign((_, name) => ({
    start: action((ctx) => {
      const land = ctx.get(landState.data)
      if (!land) return

      landEditingState.title(ctx, land.title ?? "")
      resetFiles(ctx)
      landEditingState.mode(ctx, 1)
    }, `${name}.start`),
    resetFull: action((ctx) => {
      landEditingState.mode.reset(ctx)
      landEditingState.title.reset(ctx)
      resetFiles(ctx)
    }, `${name}.resetFull`),
    banner: atom(null, `${name}.banner`).pipe(
      withAssign((_, name) => ({
        apply: action((ctx, e: React.FormEvent<HTMLInputElement>) => {
          const file = e.currentTarget.files?.[0]
          if (!file) return

          landEditingState.bannerFile(ctx, {
            file,
            preview: URL.createObjectURL(file)
          })
          landEditingState.bannerRemoved(ctx, false)
        }, `${name}.apply`),
        remove: action((ctx) => {
          landEditingState.bannerFile(ctx, null)
          landEditingState.bannerRemoved(ctx, true)
        }, `${name}.remove`)
      }))
    ),
    gallery: atom(null, `${name}.gallery`).pipe(
      withAssign((_, name) => ({
        add: action((ctx, files: FileList | null) => {
          if (!files) return

          const next = Array.from(files).map((file) => ({
            file,
            preview: URL.createObjectURL(file)
          }))

          landEditingState.galleryFiles(ctx, (state) => [...state, ...next])
        }, `${name}.add`),
        removePending: action((ctx, index: number) => {
          landEditingState.galleryFiles(ctx, (state) => state.filter((_, idx) => idx !== index))
        }, `${name}.removePending`),
        removeExisting: action((ctx, url: string) => {
          landEditingState.galleryRemoved(ctx, (state) =>
            state.includes(url) ? state : [...state, url])
        }, `${name}.removeExisting`),
        restore: action((ctx, url: string) => {
          landEditingState.galleryRemoved(ctx, (state) => state.filter((item) => item !== url))
        }, `${name}.restore`)
      }))
    ),
    submit: reatomAsync(async (ctx) => {
      const land = ctx.get(landState.data)
      if (!land) return null

      const ulid = land.ulid
      const title = ctx.get(landEditingState.title)
      const bannerFile = ctx.get(landEditingState.bannerFile)
      const bannerRemoved = ctx.get(landEditingState.bannerRemoved)
      const galleryFiles = ctx.get(landEditingState.galleryFiles)
      const galleryRemoved = ctx.get(landEditingState.galleryRemoved)

      if (title !== (land.title ?? "")) {
        await client.patch("/server/lands/{ulid}", {
          params: { path: { ulid } },
          json: { title: title.trim() || null }
        })
      }

      let banner = land.details.banner
      if (bannerRemoved) {
        await client.delete("/server/lands/{ulid}/banner", {
          params: { path: { ulid } }
        })
        banner = null
      }
      if (bannerFile) {
        const form = new FormData()
        form.append("file", bannerFile.file)
        const result = await client.post("/server/lands/{ulid}/banner", {
          params: { path: { ulid } },
          body: form
        })
        banner = `${LANDS_PREFIX}${result.key}`
      }

      let gallery = land.details.gallery.filter((url) => !galleryRemoved.includes(url))
      for (const url of galleryRemoved) {
        await client.delete("/server/lands/{ulid}/gallery", {
          params: { path: { ulid } },
          json: { url: toLandKey(url) }
        })
      }
      for (const item of galleryFiles) {
        const form = new FormData()
        form.append("file", item.file)
        const result = await client.post("/server/lands/{ulid}/gallery", {
          params: { path: { ulid } },
          body: form
        })
        gallery = [...gallery, `${LANDS_PREFIX}${result.key}`]
      }

      landState.data(ctx, {
        ...land,
        title: title.trim() || null,
        details: { banner, gallery }
      })

      return true
    }, {
      name: `${name}.submit`,
      onFulfill: (ctx, res) => {
        if (!res) return

        toast.success(translate["land.editing.saved"]())
        landEditing.resetFull(ctx)
      },
      onReject: (_, e) => {
        logError(e, { type: "combined" })
        toast.error(translate["land.editing.save-error"]())
      }
    }).pipe(
      withStatusesAtom(),
      withErrorAtom()
    )
  }))
)

export const changesIsExistsAtom = atom<boolean>((ctx) => {
  if (ctx.spy(landEditingState.mode) !== 1) return false

  const land = ctx.spy(landState.data)
  if (!land) return false

  return ctx.spy(landEditingState.title) !== (land.title ?? "")
    || !!ctx.spy(landEditingState.bannerFile)
    || ctx.spy(landEditingState.bannerRemoved)
    || ctx.spy(landEditingState.galleryFiles).length > 0
    || ctx.spy(landEditingState.galleryRemoved).length > 0
}, "changesIsExist")

export const landActionTitleAtom = atom((ctx) => ctx.spy(landEditingState.mode) === 0
  ? translate["land.edit"]() : translate["land.view"]())
