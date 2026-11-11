import { Carousel } from "@ark-ui/solid/carousel";
import { Dialog } from "@ark-ui/solid/dialog";
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { Index, Show, createMemo } from "solid-js";
import { Portal } from "solid-js/web";
import { Icon } from "@/shared/ui/icon";
import { Typography } from "@/shared/ui/typography";
import { DialogClose, dialogVariant } from "@/shared/ui/dialog";
import { translate } from "@/shared/locales/helpers";
import {
  GALLERY_ITEMS,
  closeGallery,
  galleryState,
  galleryTagLabel,
  nextGallery,
  openGallery,
  prevGallery
} from "../(models)/gallery.model";

export const GalleryLightbox = () => {
  const ctx = useCtx()
  const [selected] = useAtom(galleryState.selected)

  const item = createMemo(() => GALLERY_ITEMS[selected() ?? 0])

  return (
    <Dialog.Root
      open={selected() !== null}
      onOpenChange={(details) => {
        if (!details.open) closeGallery(ctx)
      }}
    >
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner class={dialogVariant.positioner()}>
          <Dialog.Content
            class={dialogVariant.content({
              className: "p-0! max-h-[92vh] max-w-[min(1280px,96vw)] panel-reset"
            })}
          >
            <Dialog.Title class="sr-only">
              {item().title()}
            </Dialog.Title>

            <div class="relative w-full bg-black">
              <Carousel.Root
                slideCount={GALLERY_ITEMS.length}
                page={selected() ?? 0}
                onPageChange={(details) => openGallery(ctx, details.page)}
                allowMouseDrag
                loop
                spacing="16px"
                class="w-full"
              >
                <Carousel.ItemGroup class="flex w-full overflow-hidden">
                  <Index each={GALLERY_ITEMS}>
                    {(galleryItem, idx) => (
                      <Carousel.Item
                        index={idx}
                        class="flex min-w-0 flex-[0_0_100%] items-center justify-center"
                      >
                        <img
                          src={galleryItem().src}
                          alt={galleryItem().title()}
                          width={1920}
                          height={1080}
                          class="max-h-[76vh] w-full bg-black object-contain"
                        />
                      </Carousel.Item>
                    )}
                  </Index>
                </Carousel.ItemGroup>

                <div class="absolute bottom-3 left-0 right-0 flex justify-center">
                  <Carousel.IndicatorGroup class="flex gap-2 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
                    <Index each={GALLERY_ITEMS}>
                      {(_, idx) => (
                        <Carousel.Indicator
                          index={idx}
                          class="h-2 w-2 cursor-pointer border-none bg-neutral-400/80 data-[current]:bg-gold"
                        />
                      )}
                    </Index>
                  </Carousel.IndicatorGroup>
                </div>
              </Carousel.Root>

              <button
                type="button"
                aria-label={translate["gallery.lightbox.prev"]()}
                onClick={() => prevGallery(ctx)}
                class="absolute left-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center border border-neutral-700 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
              >
                <Icon name="sprite:arrow-left" class="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label={translate["gallery.lightbox.next"]()}
                onClick={() => nextGallery(ctx)}
                class="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center border border-neutral-700 bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/90"
              >
                <Icon name="sprite:arrow-right" class="h-5 w-5" />
              </button>
            </div>

            <div class="flex w-full flex-col items-start justify-between gap-2 px-3 py-3 sm:flex-row sm:items-center sm:px-4">
              <div class="flex min-w-0 flex-col gap-0.5">
                <Typography color="white" class="text-base sm:text-lg">
                  {item().title()}
                </Typography>
                <span class="text-xs uppercase tracking-wider text-neutral-500">
                  {galleryTagLabel(item().tag)}
                </span>
              </div>
              <div class="flex shrink-0 items-center gap-3 text-xs text-neutral-400">
                <span class="tabular-nums">
                  {(selected() ?? 0) + 1} / {GALLERY_ITEMS.length}
                </span>
                <a
                  href={item().src}
                  target="_blank"
                  rel="noreferrer"
                  class="text-green-400 underline-offset-4 hover:underline"
                >
                  {translate["gallery.lightbox.original"]()}
                </a>
              </div>
            </div>

            <Show when={selected() !== null}>
              <DialogClose />
            </Show>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
