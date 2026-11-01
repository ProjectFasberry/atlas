import { Carousel } from "@ark-ui/solid/carousel"
import { GALLERY_LIST, selectedKeyAtom } from "../(models)/gallery.model"
import { useAtom } from "@reatom/npm-solid-js"
import { carouselVariant } from "@/shared/ui/carousel"
import { Index } from "solid-js"
import { Dialog } from "@ark-ui/solid/dialog"
import { Portal } from "solid-js/web"
import { DialogClose, dialogVariant } from "@/shared/ui/dialog"

const CarouselGallery = () => {
  const [selectedAtom, setSelectedAtom] = useAtom(selectedKeyAtom)

  return (
    <Carousel.Root
      slideCount={GALLERY_LIST.length}
      draggable={false}
      page={selectedAtom()}
      onPageChange={(details) => setSelectedAtom(details.page)}
      class={carouselVariant.root()}
      allowMouseDrag={true}
      loop
      spacing={"16px"}
    >
      <Carousel.ItemGroup class={carouselVariant.itemGroup()}>
        <Index each={GALLERY_LIST}>
          {(image, idx) => (
            <Carousel.Item index={idx} class={carouselVariant.item()}>
              <img
                loading="lazy"
                src={image()}
                alt=""
                class="bg-transparent!"
                width={1920}
                height={1080}
              />
            </Carousel.Item>
          )}
        </Index>
      </Carousel.ItemGroup>
      <div class="absolute bottom-4 flex items-center justify-center right-0 left-0">
        <Carousel.IndicatorGroup class={carouselVariant.indicatorGroup()}>
          <Index each={GALLERY_LIST}>
            {(_, idx) => <Carousel.Indicator index={idx} class={carouselVariant.indicator()} />}
          </Index>
        </Carousel.IndicatorGroup>
      </div>
    </Carousel.Root>
  )
}

export const GalleryItemDialog = (props: { image: string }) => {
  return (
    <Dialog.Root>
      <Dialog.Trigger class='flex flex-col overflow-hidden hover:brightness-50'>
        <img
          src={props.image} loading="lazy" width={1280} alt="" height={720} class="w-auto object-cover"
        />
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop class={dialogVariant.backdrop()} />
        <Dialog.Positioner class={dialogVariant.positioner()}>
          <Dialog.Content
            class={dialogVariant.content({
              className: `p-0! max-h-[720px] max-w-[1280px] panel-reset`
            })}
          >
            <CarouselGallery />
            <DialogClose />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
