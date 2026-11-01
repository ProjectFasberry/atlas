import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Typography } from "@/shared/ui/typography";
import { Link } from "@/shared/components/link";
import { Button } from "@/shared/ui/button";
import { getStaticObject } from "@/shared/lib/helpers";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { Overlay } from "@/shared/ui/overlay";
import { WrapperTitle } from "@/shared/ui/wrapper-title";
import { useAtom } from "@reatom/npm-solid-js";
import { For } from "solid-js";
import { GalleryItemDialog } from "./(components)/gallery-carousel";
import { GALLERY_LIST, selectedKeyAtom } from "./(models)/gallery.model";
import { translate } from "@/shared/locales/helpers";

const CommunityGallery = () => {
  const [_, update] = useAtom(selectedKeyAtom)

  return (
    <For each={GALLERY_LIST}>
      {(image, idx) => (
        <div onClick={() => update(idx())}>
          <GalleryItemDialog image={image} />
        </div>
      )}
    </For>
  )
}

const url = getStaticObject("arts", "adventure-in-blossom.jpg")

export default function GalleryPage() {
  return (
    <MainWrapperPage variant="with_section">
      <div
        class={sectionVariant({ className: "bg-bottom md:bg-center bg-cover" })}
        style={{ "background-image": `url(${url})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-center">
            <div class="flex flex-col gap-2 lg:max-w-3xl">
              <h1 class={sectionVariantChild().title({ className: "text-gold" })}>
                {translate["gallery.title"]()}
              </h1>
              <Typography color="white" class={sectionVariantChild().subtitle()}>
                {translate["gallery.description"]()}
              </Typography>
            </div>
            <Link href="#commuinity" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography color="white" class="text-lg">
                  {translate["gallery.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>
      <div class="full-screen-section py-32">
        <div id="commuinity" class="flex flex-col gap-6 w-full responsive p-2">
          <div class="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3 auto-rows-auto gap-2">
            <CommunityGallery />
          </div>
        </div>
      </div>
    </MainWrapperPage>
  )
}
