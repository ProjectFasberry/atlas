import { Index, Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { Carousel } from '@ark-ui/solid/carousel'
import {
  resolveSpawnSlides, setSpawnPage, spawnCarouselState,
} from "../(models)/spawn-carousel.model"
import { carouselVariant } from "@/shared/ui/carousel"
import { Button } from "@/shared/ui/button"
import { useAtomAccessor } from "@/shared/lib/utils"
import { reatomComponent } from "@/shared/lib/reatom"
import { siteEdit } from "@/shared/models/site-edit.model"
import { openAssetPicker } from "@/shared/models/storage.model"
import { getStaticAsset } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import type { Data } from "../+data"

export const SpawnCarousel = reatomComponent(({ ctx }) => {
  const page = useAtomAccessor(spawnCarouselState.page)
  const pageData = useData<Data>()
  const editing = useAtomAccessor(siteEdit.active)
  const editContent = useAtomAccessor(siteEdit.content)

  const editSlides = () => {
    const content = editContent()
    return editing() && content?.kind === "home" ? content.slides : []
  }

  const images = () => editing()
    ? editSlides().map((slide) => ({ src: getStaticAsset(slide.imageKey), alt: slide.alt }))
    : resolveSpawnSlides(pageData?.content ?? null)

  return (
    <div class="flex w-full flex-col gap-2">
      <Carousel.Root
        slideCount={images().length}
        class={carouselVariant.root()}
        page={page()}
        allowMouseDrag={!editing()}
        onPageChange={(details) => setSpawnPage(ctx, details.page)}
        loop
        slidesPerPage={1.4}
        snapType="proximity"
        spacing={"16px"}
      >
        <Carousel.ItemGroup class={carouselVariant.itemGroup()}>
          <Index each={images()}>
            {(image, idx) => (
              <Carousel.Item index={idx} class={`${carouselVariant.item()} relative`}>
                <img
                  src={image().src}
                  draggable={false}
                  class="max-h-270 brightness-75"
                  loading="lazy"
                  alt={image().alt}
                />
                <Show when={editing()}>
                  <div class="transparent-achievement-panel absolute top-2 right-2
                    left-2 z-2 flex flex-col gap-1 p-2">
                    <div class="flex items-center gap-1">
                      <input
                        class="w-full border border-dashed border-green-400/45
                        bg-black/40 px-1 text-xs outline-none focus:border-green-400"
                        placeholder={translate["edit.image-key"]()}
                        value={editSlides()[idx]?.imageKey ?? ""}
                        onInput={(event) => siteEdit.setHomeSlide(ctx, idx, { imageKey: event.currentTarget.value })}
                      />
                      <Button
                        class="shrink-0 px-2 py-1 text-[11px]"
                        onClick={() => openAssetPicker(ctx, { kind: "slide", index: idx })}
                      >
                        {translate["edit.picker.open"]()}
                      </Button>
                    </div>
                    <div class="flex items-center gap-1">
                      <input
                        class="w-full border border-dashed border-green-400/45
                        bg-black/40 px-1 text-xs outline-none focus:border-green-400"
                        placeholder={translate["edit.alt"]()}
                        value={editSlides()[idx]?.alt ?? ""}
                        onInput={(event) => siteEdit.setHomeSlide(ctx, idx, { alt: event.currentTarget.value })}
                      />
                      <Button
                        class="shrink-0 px-2 py-1 text-[11px]"
                        onClick={() => siteEdit.removeSlide(ctx, idx)}
                      >
                        {translate["edit.remove"]()}
                      </Button>
                    </div>
                  </div>
                </Show>
              </Carousel.Item>
            )}
          </Index>
        </Carousel.ItemGroup>
        <div class="absolute bottom-4 flex items-center justify-center right-0 left-0">
          <Carousel.IndicatorGroup class={carouselVariant.indicatorGroup()}>
            <Index each={images()}>
              {(_, idx) => <Carousel.Indicator class={carouselVariant.indicator()} index={idx} />}
            </Index>
          </Carousel.IndicatorGroup>
        </div>
      </Carousel.Root>
      <Show when={editing()}>
        <Button
          class="w-fit px-3 py-1.5 text-xs"
          onClick={() => siteEdit.addSlide(ctx)}
        >
          {translate["edit.add-slide"]()}
        </Button>
      </Show>
    </div>
  )
}, "SpawnCarousel")
