import { action, atom, withAssign } from "@reatom/framework";
import { getStaticObject } from "@/shared/lib/helpers";

export const SPAWN_IMAGES = [
  getStaticObject("images", "offenburg-1.webp"),
  getStaticObject("images", "offenburg-2.webp"),
  getStaticObject("images", "offenburg-3.webp"),
  getStaticObject("images", "offenburg-4.webp"),
  getStaticObject("images", "offenburg-5.webp"),
]

export const spawnCarouselState = atom(null, "spawnCarouselState").pipe(
  withAssign((_, name) => ({
    page: atom(0, `${name}.page`)
  }))
)

export const setSpawnPage = action(
  (ctx, page: number) => spawnCarouselState.page(ctx, page),
  "setSpawnPage"
)
