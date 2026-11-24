import { Show } from "solid-js"
import { Link } from "@/shared/components/link"
import { Button } from "@/shared/ui/button"
import { Overlay } from "@/shared/ui/overlay"
import { Typography } from "@/shared/ui/typography"
import { WrapperTitle } from "@/shared/ui/wrapper-title"
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants"
import { getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

const bgImage = getStaticObject("arts", "bzzvanet-.jpg")

export const ModpackHero = () => {
  const hidden = useBlockHidden("modpack-hero")

  return (
    <Show when={!hidden()}>
      <div
        class={sectionVariant({ className: "bg-bottom md:bg-center bg-cover" })}
        style={{ "background-image": `url(${bgImage})` }}
      >
        <Overlay variant="default" />
        <WrapperTitle>
          <div class="flex flex-col gap-6 w-full lg:max-w-3xl items-start justify-start">
            <div class="flex flex-col gap-2 lg:max-w-3xl">
              <BlockTitle
                id="modpack-hero"
                fallback={translate["modpack.title"]()}
                as="h1"
                class={sectionVariantChild().title({ className: "text-gold" })}
              />
              <BlockSubtitle
                id="modpack-hero"
                fallback={translate["modpack.subtitle"]()}
                class={sectionVariantChild().subtitle()}
              />
              <BlockControls id="modpack-hero" />
            </div>
            <Link href="#launcher" class={sectionVariantChild().action()}>
              <Button class="w-full px-6 py-0.5 gap-2">
                <Typography color="white" class="text-lg">
                  {translate["modpack.action-text"]()}
                </Typography>
              </Button>
            </Link>
          </div>
        </WrapperTitle>
      </div>
    </Show>
  )
}
