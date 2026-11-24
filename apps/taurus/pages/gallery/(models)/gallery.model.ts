import { action, atom, withAssign } from "@reatom/framework";
import { getCommunityFolder } from "@/shared/const/folders";
import { translate } from "@/shared/locales/helpers";

export type GalleryTag = "nature" | "cities" | "events" | "builds"
export type GalleryFilter = "all" | GalleryTag

export type GalleryItem = {
  key: string
  tag: GalleryTag
  title: () => string
  /**
   * Absolute URL served by the API route. While the gallery is still static the
   * field is empty and `galleryItemSrc` falls back to the volume folder; once
   * the API returns links, only this list has to change.
   */
  src?: string
  /** Smaller rendition for the grid; the lightbox always uses `src`. */
  thumb?: string
}

/** Bundled fallback list; the API replaces it once the dynamic gallery lands. */
export const GALLERY_ITEMS: GalleryItem[] = [
  { key: "moon", tag: "nature", title: () => translate["gallery.items.moon"]() },
  { key: "sunset", tag: "nature", title: () => translate["gallery.items.sunset"]() },
  { key: "market", tag: "cities", title: () => translate["gallery.items.market"]() },
  { key: "duck", tag: "builds", title: () => translate["gallery.items.duck"]() },
  { key: "dragon_dead", tag: "events", title: () => translate["gallery.items.dragon"]() },
  { key: "hills", tag: "nature", title: () => translate["gallery.items.hills"]() },
  { key: "market_seller", tag: "cities", title: () => translate["gallery.items.seller"]() },
  { key: "offenburg", tag: "cities", title: () => translate["gallery.items.offenburg"]() },
  { key: "night", tag: "cities", title: () => translate["gallery.items.night"]() },
  { key: "water_sand", tag: "nature", title: () => translate["gallery.items.shore"]() },
  { key: "early_sunset", tag: "nature", title: () => translate["gallery.items.early-sunset"]() }
]

/**
 * The image an item should render. API URLs win; the static volume keeps the
 * page working until the gallery endpoint returns its own links.
 */
export const galleryItemSrc = (item: GalleryItem, variant: "full" | "thumb" = "full") =>
  (variant === "thumb" ? item.thumb : item.src) ?? getCommunityFolder(item.key)

export const galleryTagLabel = (tag: GalleryTag) => {
  switch (tag) {
    case "nature":
      return translate["gallery.tags.nature"]()
    case "cities":
      return translate["gallery.tags.cities"]()
    case "events":
      return translate["gallery.tags.events"]()
    case "builds":
      return translate["gallery.tags.builds"]()
  }
}

export const galleryState = atom(null, "galleryState").pipe(
  withAssign((_, name) => ({
    items: atom<GalleryItem[]>(GALLERY_ITEMS, `${name}.items`),
    filter: atom<GalleryFilter>("all", `${name}.filter`),
    selected: atom<number | null>(null, `${name}.selected`)
  }))
)

/** Feeds the gallery from the API; an empty list keeps the bundled items. */
export const setGalleryItems = action(
  (ctx, items: GalleryItem[]) => galleryState.items(ctx, items.length > 0 ? items : GALLERY_ITEMS),
  "setGalleryItems"
)

export const setGalleryFilter = action(
  (ctx, value: GalleryFilter) => galleryState.filter(ctx, value),
  "setGalleryFilter"
)

export const openGallery = action(
  (ctx, index: number) => galleryState.selected(ctx, index),
  "openGallery"
)

export const closeGallery = action(
  (ctx) => galleryState.selected(ctx, null),
  "closeGallery"
)

export const nextGallery = action((ctx) => {
  const current = ctx.get(galleryState.selected)
  const total = ctx.get(galleryState.items).length
  if (current === null || total === 0) return

  galleryState.selected(ctx, (current + 1) % total)
}, "nextGallery")

export const prevGallery = action((ctx) => {
  const current = ctx.get(galleryState.selected)
  const total = ctx.get(galleryState.items).length
  if (current === null || total === 0) return

  galleryState.selected(ctx, (current - 1 + total) % total)
}, "prevGallery")
