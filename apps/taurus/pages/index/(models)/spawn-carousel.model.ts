import { action, atom, withAssign } from "@reatom/framework";
import { getStaticAsset } from "@/shared/lib/helpers";
import type { HomeContent } from "@/shared/api/site";

export type SpawnSlide = { imageKey: string; alt: string; src: string }

/** Shipped defaults; the API document overrides them when it has a carousel. */
const DEFAULT_SPAWN_KEYS = [
  "images/offenburg-1.webp",
  "images/offenburg-2.webp",
  "images/offenburg-3.webp",
  "images/offenburg-4.webp",
  "images/offenburg-5.webp",
]

const DEFAULT_SPAWN_SLIDES: SpawnSlide[] = DEFAULT_SPAWN_KEYS.map((imageKey) => ({
  imageKey,
  alt: "",
  src: getStaticAsset(imageKey),
}))

/** Published carousel and the editor's slide list come from the same document. */
export const resolveSpawnSlides = (content: HomeContent | null): SpawnSlide[] => {
  const items = content?.carousel

  if (!items?.length) return DEFAULT_SPAWN_SLIDES

  return items.map((item) => ({
    imageKey: item.image,
    alt: item.alt ?? "",
    src: getStaticAsset(item.image),
  }))
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
