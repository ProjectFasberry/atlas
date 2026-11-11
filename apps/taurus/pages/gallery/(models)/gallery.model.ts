import { action, atom, withAssign } from "@reatom/framework";
import { getCommunityFolder } from "@/shared/const/folders";
import { translate } from "@/shared/locales/helpers";

export type GalleryTag = "nature" | "cities" | "events" | "builds"
export type GalleryFilter = "all" | GalleryTag

export type GalleryItem = {
  key: string
  src: string
  tag: GalleryTag
  title: () => string
}

export const GALLERY_ITEMS: GalleryItem[] = [
  { key: "moon", src: getCommunityFolder("moon"), tag: "nature", title: () => translate["gallery.items.moon"]() },
  { key: "sunset", src: getCommunityFolder("sunset"), tag: "nature", title: () => translate["gallery.items.sunset"]() },
  { key: "market", src: getCommunityFolder("market"), tag: "cities", title: () => translate["gallery.items.market"]() },
  { key: "duck", src: getCommunityFolder("duck"), tag: "builds", title: () => translate["gallery.items.duck"]() },
  { key: "dragon_dead", src: getCommunityFolder("dragon_dead"), tag: "events", title: () => translate["gallery.items.dragon"]() },
  { key: "hills", src: getCommunityFolder("hills"), tag: "nature", title: () => translate["gallery.items.hills"]() },
  { key: "market_seller", src: getCommunityFolder("market_seller"), tag: "cities", title: () => translate["gallery.items.seller"]() },
  { key: "offenburg", src: getCommunityFolder("offenburg"), tag: "cities", title: () => translate["gallery.items.offenburg"]() },
  { key: "night", src: getCommunityFolder("night"), tag: "cities", title: () => translate["gallery.items.night"]() },
  { key: "water_sand", src: getCommunityFolder("water_sand"), tag: "nature", title: () => translate["gallery.items.shore"]() },
  { key: "early_sunset", src: getCommunityFolder("early_sunset"), tag: "nature", title: () => translate["gallery.items.early-sunset"]() }
]

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
    filter: atom<GalleryFilter>("all", `${name}.filter`),
    selected: atom<number | null>(null, `${name}.selected`)
  }))
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
  if (current === null) return

  galleryState.selected(ctx, (current + 1) % GALLERY_ITEMS.length)
}, "nextGallery")

export const prevGallery = action((ctx) => {
  const current = ctx.get(galleryState.selected)
  if (current === null) return

  galleryState.selected(ctx, (current - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length)
}, "prevGallery")
