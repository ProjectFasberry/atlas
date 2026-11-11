import { Link } from "@/shared/components/link";
import { Button } from "@/shared/ui/button";
import { MainWrapperPage } from "@/shared/ui/main-wrapper";
import { Overlay } from "@/shared/ui/overlay";
import { Typography } from "@/shared/ui/typography";
import { WrapperTitle } from "@/shared/ui/wrapper-title";
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants";
import { getStaticObject } from "@/shared/lib/helpers";
import { translate } from "@/shared/locales/helpers";
import { GalleryGrid } from "./(components)/gallery-grid";

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
            <Link href="#gallery" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography color="white" class="text-lg">
                  {translate["gallery.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>
      <div class="full-screen-section py-16 lg:py-24">
        <div class="responsive mx-auto">
          <GalleryGrid />
        </div>
      </div>
    </MainWrapperPage>
  )
}
