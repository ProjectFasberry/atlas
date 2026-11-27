import { Dialog } from "@ark-ui/solid/dialog"
import { For, Show, createEffect, createMemo } from "solid-js"
import { Portal } from "solid-js/web"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { dialogVariant } from "@/shared/ui/dialog"
import { useAtomAccessor } from "@/shared/lib/utils"
import { reatomComponent } from "@/shared/lib/reatom"
import { translate } from "@/shared/locales/helpers"
import { env } from "@/shared/env"
import { siteEdit } from "@/shared/models/site-edit.model"
import {
  assetPicker,
  assetPickerTarget,
  assetStorage,
  assetStorageState,
  closeAssetPicker,
  setAssetSearch,
} from "@/shared/models/storage.model"

const IMAGE_RE = /\.(png|jpe?g|webp|gif|avif|svg)$/i
/** Opening a large folder should not fire a presign request per file at once. */
const PREVIEW_LIMIT = 60
/** Readable without a signature, so the grid needs no presign round trip. */
const PUBLIC_BUCKET = "static"

/**
 * Bucket browser in a dialog. It writes the chosen S3 key into the editor field
 * that opened it, so the same picker serves server covers and spawn slides.
 */
export const AssetPicker = reatomComponent(({ ctx }) => {
  const target = useAtomAccessor(assetPickerTarget)
  const search = useAtomAccessor(assetPicker.search)
  const buckets = useAtomAccessor(assetStorage.listBuckets.dataAtom)
  const bucketsPending = useAtomAccessor(assetStorage.listBuckets.statusesAtom)
  const page = useAtomAccessor(assetStorage.listObjects.dataAtom)
  const pagePending = useAtomAccessor(assetStorage.listObjects.statusesAtom)
  const pageError = useAtomAccessor(assetStorage.listObjects.errorAtom)
  const bucket = useAtomAccessor(assetStorageState.bucket)
  const folder = useAtomAccessor(assetStorageState.folder)
  const previews = useAtomAccessor(assetStorage.previews)

  const open = () => target() !== null

  const objects = createMemo(() => {
    const query = search().trim().toLowerCase()

    return (page()?.contents ?? []).filter((object) =>
      object.key && (!query || object.key.toLowerCase().includes(query))
    )
  })

  const folders = createMemo(() =>
    (page()?.commonPrefixes ?? []).map((entry) => entry.prefix).filter(Boolean)
  )

  const images = createMemo(() => objects().filter((object) => IMAGE_RE.test(object.key)))
  const files = createMemo(() => objects().filter((object) => !IMAGE_RE.test(object.key)))

  const crumbs = createMemo(() => {
    const parts = folder().replace(/\/$/, "").split("/").filter(Boolean)
    const result: { label: string; prefix: string }[] = []

    for (const [index, part] of parts.entries()) {
      result.push({ label: part, prefix: `${parts.slice(0, index + 1).join("/")}/` })
    }

    return result
  })

  createEffect(() => {
    if (!open()) return

    if (!buckets()) assetStorage.listBuckets(ctx)
  })

  createEffect(() => {
    const list = buckets()
    if (!open() || !list?.length || bucket()) return

    const preferred = list.find((entry) => entry.name === "static" && entry.available !== false) ?? list[0]

    assetStorage.selectBucket(ctx, preferred.name)
    assetStorage.load(ctx)
  })

  createEffect(() => {
    const name = bucket()
    if (!open() || !name || name === PUBLIC_BUCKET) return

    const cache = previews()
    let requested = 0

    for (const object of images()) {
      if (requested >= PREVIEW_LIMIT) break
      if (cache[`${name}/${object.key}`]) continue

      requested += 1
      assetStorage.loadPreview(ctx, { bucket: name, key: object.key })
    }
  })

  const goTo = (prefix: string) => {
    assetStorage.openFolder(ctx, prefix)
    assetStorage.load(ctx)
  }

  const goUp = () => {
    const parts = folder().replace(/\/$/, "").split("/").filter(Boolean)
    parts.pop()
    goTo(parts.length ? `${parts.join("/")}/` : "")
  }

  const choose = (key: string) => {
    const current = target()

    if (current?.kind === "server") siteEdit.setServer(ctx, current.id, { imageKey: key })
    if (current?.kind === "slide") siteEdit.setHomeSlide(ctx, current.index, { imageKey: key })
    if (current?.kind === "feature") {
      siteEdit.setFeature(ctx, current.serverId, current.index, { iconKey: key })
    }

    closeAssetPicker(ctx)
  }

  const previewUrl = (key: string) => {
    const name = bucket()
    if (!name) return undefined
    if (name === PUBLIC_BUCKET) return `${env.VITE_VOLUME_URL}/static/${key}`

    return previews()[`${name}/${key}`]
  }

  return (
    <Dialog.Root
      open={open()}
      onOpenChange={(details) => {
        if (!details.open) closeAssetPicker(ctx)
      }}
    >
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner class={dialogVariant.positioner()}>
          <Dialog.Content
            class={dialogVariant.content({
              // `items-stretch` beats the dialog's centered column, otherwise
              // the grid shrinks to the intrinsic width of its tiles. No
              // `panel-reset`: it would strip the opaque panel background.
              className: "flex max-h-[88dvh] w-full max-w-[min(1000px,96vw)]! flex-col items-stretch gap-3",
            })}
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <Dialog.Title class={`${dialogVariant.title()} text-shadow-lg text-lg sm:text-xl`}>
                {translate["edit.picker.title"]()}
              </Dialog.Title>
              <Show when={(buckets()?.length ?? 0) > 1}>
                <select
                  class="raised-slot w-full cursor-pointer px-2 py-1 text-xs sm:w-auto"
                  value={bucket() ?? ""}
                  aria-label={translate["edit.picker.bucket"]()}
                  onChange={(event) => {
                    assetStorage.selectBucket(ctx, event.currentTarget.value)
                    assetStorage.load(ctx)
                  }}
                >
                  <For each={buckets()}>
                    {(entry) => <option value={entry.name}>{entry.name}</option>}
                  </For>
                </select>
              </Show>
            </div>

            <div class="flex flex-wrap items-center gap-1 text-xs text-neutral-400">
              <button
                type="button"
                class="raised-slot cursor-pointer px-2 py-1 disabled:opacity-60"
                disabled={!bucket()}
                onClick={() => goTo("")}
              >
                {bucket() ?? "—"}
              </button>
              <For each={crumbs()}>
                {(crumb) => (
                  <>
                    <span aria-hidden="true">/</span>
                    <button
                      type="button"
                      class="raised-slot cursor-pointer px-2 py-1"
                      onClick={() => goTo(crumb.prefix)}
                    >
                      {crumb.label}
                    </button>
                  </>
                )}
              </For>
              <Show when={folder()}>
                <Button class="ml-1 px-2 py-1 text-[11px]" onClick={goUp}>
                  {translate["edit.picker.up"]()}
                </Button>
              </Show>
            </div>

            <input
              class="w-full border border-dashed border-green-400/45 bg-black/40 px-2 py-1 text-xs
              outline-none focus:border-green-400"
              placeholder={translate["edit.picker.search"]()}
              value={search()}
              onInput={(event) => setAssetSearch(ctx, event.currentTarget.value)}
            />

            <div class="flex min-h-[45vh] max-h-[60vh] w-full flex-col items-stretch gap-3 overflow-y-auto overscroll-contain">
              <Show when={pageError()}>
                {(error) => (
                  <Typography color="gray" class="p-2 text-xs">
                    {error().message}
                  </Typography>
                )}
              </Show>
              <Show when={bucketsPending().isPending || pagePending().isPending}>
                <Typography color="gray" class="p-2 text-xs">
                  {translate["edit.picker.loading"]()}
                </Typography>
              </Show>

              <Show when={folders().length > 0}>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  <For each={folders()}>
                    {(prefix) => (
                      <button
                        type="button"
                        class="raised-slot flex cursor-pointer items-center gap-2 px-2 py-1.5 text-left text-xs"
                        onClick={() => goTo(prefix)}
                      >
                        <span aria-hidden="true">▸</span>
                        <span class="truncate">{prefix.replace(folder(), "").replace(/\/$/, "")}</span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={images().length > 0}>
                <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  <For each={images()}>
                    {(object) => (
                      <button
                        type="button"
                        title={object.key}
                        class="group relative h-20 overflow-hidden border-2 border-neutral-600
                        bg-neutral-900 p-0.5 hover:border-green-400 sm:h-24"
                        onClick={() => choose(object.key)}
                      >
                        <Show when={previewUrl(object.key)}>
                          {(url) => (
                            <img
                              src={url()}
                              alt=""
                              loading="lazy"
                              class="absolute inset-0 size-full object-cover"
                            />
                          )}
                        </Show>
                        <span class="absolute inset-x-0 bottom-0 truncate bg-black/70 px-1 py-0.5
                        text-left text-[10px] text-neutral-200">
                          {object.key.split("/").pop()}
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              </Show>

              <Show when={files().length > 0}>
                <ul class="flex flex-col gap-1">
                  <For each={files()}>
                    {(object) => (
                      <li>
                        <button
                          type="button"
                          class="truncate text-left text-xs text-neutral-300 hover:text-white"
                          onClick={() => choose(object.key)}
                        >
                          {object.key}
                        </button>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>

              <Show when={Boolean(bucket()) && !pagePending().isPending && objects().length === 0 && folders().length === 0}>
                <Typography color="gray" class="p-2 text-xs">
                  {translate["edit.picker.empty"]()}
                </Typography>
              </Show>
            </div>

            <div class="flex items-center justify-between gap-2">
              <Typography color="gray" class="text-[11px]">
                {bucket() ?? ""} / {folder() || "—"}
              </Typography>
              <Dialog.CloseTrigger class="button px-4 py-1 text-xs text-white">
                {translate["edit.picker.close"]()}
              </Dialog.CloseTrigger>
            </div>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}, "AssetPicker")
