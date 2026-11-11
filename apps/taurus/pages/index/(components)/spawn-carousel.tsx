import { Index } from "solid-js"
import { Carousel } from '@ark-ui/solid/carousel'
import { useAtom, useCtx } from "@reatom/npm-solid-js"
import { SPAWN_IMAGES, setSpawnPage, spawnCarouselState } from "../(models)/spawn-carousel.model"
import { carouselVariant } from "@/shared/ui/carousel"

export const SpawnCarousel = () => {
  const ctx = useCtx();
  const [page] = useAtom(spawnCarouselState.page)

  return (
    <Carousel.Root
      slideCount={SPAWN_IMAGES.length}
      class={carouselVariant.root()}
      page={page()}
      allowMouseDrag={true}
      onPageChange={(details) => setSpawnPage(ctx, details.page)}
      loop
      autoplay
      slidesPerPage={1.4}
      snapType="proximity"
      spacing={"16px"}
    >
      <Carousel.ItemGroup class={carouselVariant.itemGroup()}>
        <Index each={SPAWN_IMAGES}>
          {(image, idx) => (
            <Carousel.Item index={idx} class={carouselVariant.item()}>
              <img
                src={image()}
                draggable={false}
                class="max-h-[1080px] brightness-75"
                loading="lazy"
                alt=""
              />
            </Carousel.Item>
          )}
        </Index>
      </Carousel.ItemGroup>
      <div class="absolute bottom-4 flex items-center justify-center right-0 left-0">
        <Carousel.IndicatorGroup class={carouselVariant.indicatorGroup()}>
          <Index each={SPAWN_IMAGES}>
            {(_, idx) => <Carousel.Indicator class={carouselVariant.indicator()} index={idx} />}
          </Index>
        </Carousel.IndicatorGroup>
      </div>
    </Carousel.Root>
  )
}
