import { action, atom, reatomAsync, withAbort, withErrorAtom, withStatusesAtom } from "@reatom/framework";
import { getLocale } from "@/paraglide/runtime";
import { translate } from "@/shared/locales/helpers";
import {
  fetchGallery,
  type GalleryApiItem, type GalleryCounts, type GalleryFilter, type GalleryPage, type GalleryTag,
} from "@/shared/api/gallery";

export type { GalleryApiItem as GalleryItem, GalleryFilter, GalleryTag };

const EMPTY_COUNTS: GalleryCounts = { all: 0, nature: 0, cities: 0, events: 0, builds: 0 };

/** API links are absolute; the grid takes a smaller rendition, the lightbox the full one. */
export const galleryItemSrc = (item: GalleryApiItem, variant: "full" | "thumb" = "full") =>
  variant === "thumb" ? item.thumb : item.src;

/**
 * Seeded items keep their caption in paraglide, editor-created ones carry text.
 * The id is the last resort, so a broken translation never hides an image.
 */
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

/*
 * Gallery list state.
 *
 * The cursor protocol lives here, not in the component: the page only observes
 * a sentinel and calls `loadMoreGallery`, so resets, guards and appends are the
 * same for any list view built on top of this model.
 */

/** Page data the atoms were seeded from; a new object means a new route visit. */
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

/** Seed from the route data; repeat renders with the same object keep the state. */
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

/** Called by the sentinel observer; all guards and the cursor live here. */
export const loadMoreGallery = action((ctx) => {
  if (ctx.get(galleryFetch.statusesAtom).isPending) return;
  if (!ctx.get(galleryHasNext) || !ctx.get(galleryCursor)) return;

  galleryFetch(ctx);
}, "loadMoreGallery");

/** First page failed: the retry either starts over or continues the list. */
export const retryGallery = action((ctx) => {
  if (ctx.get(galleryFetch.statusesAtom).isPending) return;

  galleryFetch(ctx);
}, "retryGallery");

export const openGallery = action((ctx, index: number) => {
  gallerySelected(ctx, index);

  // The carousel can be dragged past the loaded page: fetch the rest before
  // the user reaches the last slide, not after the list dead-ends.
  const total = ctx.get(galleryItems).length;
  if (ctx.get(galleryHasNext) && index >= total - 2) loadMoreGallery(ctx);
}, "openGallery");

export const closeGallery = action((ctx) => {
  gallerySelected(ctx, null);
}, "closeGallery");

export const nextGallery = action((ctx) => {
  const current = ctx.get(gallerySelected);
  const total = ctx.get(galleryItems).length;
  if (current === null || total === 0) return;

  gallerySelected(ctx, (current + 1) % total);
}, "nextGallery");

export const prevGallery = action((ctx) => {
  const current = ctx.get(gallerySelected);
  const total = ctx.get(galleryItems).length;
  if (current === null || total === 0) return;

  gallerySelected(ctx, (current - 1 + total) % total);
}, "prevGallery");
