import { action, atom, reatomAsync, withAbort, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { getLocale } from "@/paraglide/runtime";
import { translate } from "@/shared/locales/helpers";
import {
  fetchGallery,
  type GalleryApiItem, type GalleryCounts, type GalleryFilter, type GalleryPage, type GalleryTag,
} from "@/shared/api/gallery";

export type { GalleryApiItem as GalleryItem, GalleryFilter, GalleryTag };

const EMPTY_COUNTS: GalleryCounts = { all: 0, nature: 0, cities: 0, events: 0, builds: 0 };

/** Start the next page this many slides before the end of the loaded list. */
const PREFETCH_DISTANCE = 4;

export const galleryItemSrc = (item: GalleryApiItem, variant: "full" | "thumb" = "full") =>
  variant === "thumb" ? item.thumb : item.src;

export const galleryItemTitle = (item: GalleryApiItem) => {
  if (item.title) return item.title;

  const messages = translate as unknown as Record<string, (() => string) | undefined>;
  const message = item.titleKey ? messages[item.titleKey] : undefined;

  return message?.() ?? item.id;
};

export const galleryTagLabel = (tag: GalleryTag) => {
  switch (tag) {
    case "nature":
      return translate["gallery.tags.nature"]();
    case "cities":
      return translate["gallery.tags.cities"]();
    case "events":
      return translate["gallery.tags.events"]();
    case "builds":
      return translate["gallery.tags.builds"]();
  }
};

export const gallerySource = atom<GalleryPage | null>(null, "gallerySource")
export const galleryItems = atom<GalleryApiItem[]>([], "galleryItems")
export const galleryCounts = atom<GalleryCounts>(EMPTY_COUNTS, "galleryCounts")
export const galleryFilter = atom<GalleryFilter>("all", "galleryFilter")
export const galleryCursor = atom<string | null>(null, "galleryCursor")
export const galleryHasNext = atom(false, "galleryHasNext")
export const gallerySelected = atom<number | null>(null, "gallerySelected")

export const galleryFetch = reatomAsync(async (ctx) => {
  const filter = ctx.get(galleryFilter)

  return await fetchGallery({
    locale: getLocale(),
    tag: filter === "all" ? undefined : filter as GalleryTag,
    // A reset clears the cursor first, so a missing cursor is the reset signal.
    cursor: ctx.get(galleryCursor) ?? undefined,
  })
}, {
  name: "galleryFetch",
  onFulfill: (ctx, page: GalleryPage) => {
    const isReset = ctx.get(galleryCursor) === null
    const previous = ctx.get(galleryItems)

    galleryItems(ctx, isReset ? page.data : [...previous, ...page.data])
    galleryCounts(ctx, page.meta.counts)
    galleryCursor(ctx, page.meta.nextCursor)
    galleryHasNext(ctx, page.meta.hasNextPage)
  },
}).pipe(
  withStatusesAtom(),
  withErrorAtom(),
  withAbort(),
)

export const initGallery = action((ctx, page: GalleryPage | null) => {
  if (ctx.get(gallerySource) === page) return;

  gallerySource(ctx, page);
  galleryItems(ctx, page?.data ?? []);
  galleryCounts(ctx, page?.meta.counts ?? EMPTY_COUNTS);
  galleryCursor(ctx, page?.meta.nextCursor ?? null);
  galleryHasNext(ctx, Boolean(page?.meta.hasNextPage));
  galleryFilter(ctx, "all");
  gallerySelected(ctx, null);
}, "initGallery");

export const selectGalleryFilter = action((ctx, value: GalleryFilter) => {
  if (ctx.get(galleryFilter) === value) return;

  galleryFilter(ctx, value);
  gallerySelected(ctx, null);
  galleryItems(ctx, []);
  galleryCursor(ctx, null);
  galleryHasNext(ctx, false);

  galleryFetch(ctx);
}, "selectGalleryFilter");

export const loadMoreGallery = action((ctx) => {
  if (ctx.get(galleryFetch.statusesAtom).isPending) return;
  if (!ctx.get(galleryHasNext) || !ctx.get(galleryCursor)) return;

  galleryFetch(ctx);
}, "loadMoreGallery");

export const retryGallery = action((ctx) => {
  if (ctx.get(galleryFetch.statusesAtom).isPending) return;

  galleryFetch(ctx);
}, "retryGallery");

export const openGallery = action((ctx, index: number) => {
  gallerySelected(ctx, index);

  // The carousel can be dragged past the loaded page: fetch the rest before
  // the user reaches the end, not after the list dead-ends.
  const total = ctx.get(galleryItems).length;
  if (ctx.get(galleryHasNext) && index >= total - PREFETCH_DISTANCE) loadMoreGallery(ctx);
}, "openGallery");

export const closeGallery = action((ctx) => {
  gallerySelected(ctx, null);
}, "closeGallery");

export const nextGallery = action((ctx) => {
  const current = ctx.get(gallerySelected);
  const total = ctx.get(galleryItems).length;
  if (current === null || total === 0) return;

  // At the last loaded slide, wait for the next page instead of wrapping.
  if (current >= total - 1 && ctx.get(galleryHasNext)) {
    loadMoreGallery(ctx);
    return;
  }

  if (current >= total - PREFETCH_DISTANCE) loadMoreGallery(ctx);
  gallerySelected(ctx, (current + 1) % total);
}, "nextGallery");

export const prevGallery = action((ctx) => {
  const current = ctx.get(gallerySelected);
  const total = ctx.get(galleryItems).length;
  if (current === null || total === 0) return;

  gallerySelected(ctx, (current - 1 + total) % total);
}, "prevGallery");
