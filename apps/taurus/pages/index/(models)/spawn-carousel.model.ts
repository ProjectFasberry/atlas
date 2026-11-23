import { action, atom, withAssign } from "@reatom/framework";
import { getStaticAsset } from "@/shared/lib/helpers";
import type { HomeContent } from "@/shared/api/site";
import type { EditSlide } from "@/shared/models/site-edit.model";

export type SpawnImage = { src: string; alt: string }

/** Shipped defaults; the API document overrides them when it has a carousel. */
const DEFAULT_SPAWN_KEYS = [
  "images/offenburg-1.webp",
  "images/offenburg-2.webp",
  "images/offenburg-3.webp",
  "images/offenburg-4.webp",
  "images/offenburg-5.webp",
]

const DEFAULT_SPAWN_IMAGES: SpawnImage[] = DEFAULT_SPAWN_KEYS.map((key) => ({
  src: getStaticAsset(key),
  alt: "",
}))

export const createSpawnImages = (content: HomeContent | null): SpawnImage[] => {
  const items = content?.carousel

  if (!items?.length) return DEFAULT_SPAWN_IMAGES

  return items.map((item) => ({
    src: getStaticAsset(item.image),
    alt: item.alt ?? "",
  }))
}

/** Edit mode starts from the effective slides, so their keys survive a save. */
export const createSpawnEditSlides = (content: HomeContent | null): EditSlide[] => {
  const items = content?.carousel

  if (!items?.length) return DEFAULT_SPAWN_KEYS.map((imageKey) => ({ imageKey, alt: "" }))

  return items.map((item) => ({ imageKey: item.image, alt: item.alt ?? "" }))
}

export const spawnCarouselState = atom(null, "spawnCarouselState").pipe(
  withAssign((_, name) => ({
    page: atom(0, `${name}.page`)
  }))
)

export const setSpawnPage = action(
  (ctx, page: number) => spawnCarouselState.page(ctx, page),
  "setSpawnPage"
)
