import { For, Show, onCleanup, onMount } from "solid-js";
import { Link } from "@/shared/components/link";
import { getStaticObject } from "@/shared/lib/helpers";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import { type GalleryFilter, type GalleryPage } from "@/shared/api/gallery";
import {
  galleryCounts,
  galleryFetch,
  galleryFilter,
  galleryItemSrc,
  galleryItemTitle,
  galleryItems,
  galleryTagLabel,
  initGallery,
  loadMoreGallery,
  openGallery,
  retryGallery,
  selectGalleryFilter,
} from "../(models)/gallery.model";
import { GalleryLightbox } from "./gallery-lightbox";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";

const infoIcon = getStaticObject("minecraft", "icons/book_big.webp")

const filters: Array<{ value: GalleryFilter, label: () => string }> = [
  { value: "all", label: () => translate["gallery.tags.all"]() },
  { value: "nature", label: () => translate["gallery.tags.nature"]() },
  { value: "cities", label: () => translate["gallery.tags.cities"]() },
  { value: "events", label: () => translate["gallery.tags.events"]() },
  { value: "builds", label: () => translate["gallery.tags.builds"]() }
]

export const GalleryGrid = reatomComponent<{ initial: GalleryPage | null }>(({ ctx, initial }) => {
  initGallery(ctx, initial)

  const items = useAtomAccessor(galleryItems)
  const counts = useAtomAccessor(galleryCounts)
  const filter = useAtomAccessor(galleryFilter)
  const statuses = useAtomAccessor(galleryFetch.statusesAtom)
  const error = useAtomAccessor(galleryFetch.errorAtom)

  let sentinel: HTMLDivElement | undefined

  onMount(() => {
    if (!items().length) retryGallery(ctx)

    if (!sentinel) return

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      loadMoreGallery(ctx)
    }, { rootMargin: "600px" })

    observer.observe(sentinel)
    onCleanup(() => observer.disconnect())
  })

  const isAll = () => filter() === "all"

  return (
    <div id="gallery" class="flex flex-col gap-6 sm:gap-8">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <h2 class="text-xl sm:text-3xl lg:text-4xl">
            {translate["gallery.heading"]()}
          </h2>
          <span class="text-xs text-neutral-500 sm:text-sm">
            {translate["gallery.count"]({ count: counts().all })}
          </span>
        </div>
        <div class="flex flex-wrap gap-2">
          <For each={filters}>
            {(item) => (
              <button
                type="button"
                aria-pressed={filter() === item.value}
                onClick={() => selectGalleryFilter(ctx, item.value)}
                class={`${filter() === item.value
                  ? "raised-slot-active text-neutral-100"
                  : "raised-slot text-neutral-800"} cursor-pointer px-3 py-1.5 text-xs
                  sm:text-sm`
                }
              >
                {item.label()} · {counts()[item.value]}
              </button>
            )}
          </For>
        </div>
      </div>
      <div
        class="grid auto-rows-30 grid-cols-2 gap-2
        sm:auto-rows-37.5 md:grid-cols-3 md:gap-3 lg:auto-rows-47.5"
      >
        <For each={items()}>
          {(item, index) => {
            const featured = () => isAll() && index() === 0

            return (
              <button
                type="button"
                onClick={() => openGallery(ctx, index())}
                class={`group relative overflow-hidden p-1 text-left transparent-achievement-panel
                  ${featured() ? "col-span-2 row-span-2" : ""}`}
              >
                <div class="relative h-full w-full overflow-hidden bg-neutral-900">
                  <img
                    src={galleryItemSrc(item, "thumb")}
                    alt=""
                    width={item.width ?? 1920}
                    height={item.height ?? 1080}
                    loading={index() === 0 ? "eager" : "lazy"}
                    class="h-full w-full object-cover"
                  />
                  <div
                    class="absolute inset-0 bg-linear-to-t
                    from-black/85 via-black/10 to-transparent opacity-90"
                  />
                  <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
                    <div class="flex min-w-0 flex-col gap-0.5">
                      <span class="line-clamp-2 text-sm text-white sm:text-base">
                        {galleryItemTitle(item)}
                      </span>
                      <span class="text-[10px] uppercase tracking-wider text-neutral-400">
                        {galleryTagLabel(item.tag)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          }}
        </For>
        <Show when={statuses().isPending && !items().length}>
          <For each={Array.from({ length: 6 })}>
            {() => <div class="animate-pulse bg-neutral-900/70 transparent-achievement-panel" />}
          </For>
        </Show>
        <Show when={isAll() && items().length > 0}>
          <div class="col-span-2 flex flex-col justify-between
            gap-3 p-3 transparent-achievement-panel sm:p-4 md:col-span-1">
            <img
              src={infoIcon}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              draggable={false}
            />
            <div class="flex flex-col gap-1">
              <Typography color="white" class="text-sm sm:text-base">
                {translate["gallery.info.title"]()}
              </Typography>
              <Typography color="gray" class="text-xs leading-5">
                {translate["gallery.info.description"]()}
              </Typography>
            </div>
            <Link
              href="/discord"
              class="text-xs text-green-400 underline-offset-4 hover:underline"
            >
              {translate["gallery.info.action"]()} →
            </Link>
          </div>
        </Show>
      </div>
      <div ref={sentinel} class="flex h-10 items-center justify-center">
        <Show when={statuses().isPending && items().length > 0}>
          <span class="text-xs text-neutral-500">{translate["gallery.loading"]()}</span>
        </Show>
      </div>
      <Show when={error()}>
        <button
          type="button"
          onClick={() => retryGallery(ctx)}
          class="raised-slot mx-auto cursor-pointer px-4 py-2 text-xs text-neutral-300"
        >
          {translate["gallery.retry"]()}
        </button>
      </Show>
      <GalleryLightbox />
    </div>
  )
}, "GalleryGrid")
