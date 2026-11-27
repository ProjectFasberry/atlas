import { Show } from "solid-js"
import { Link } from "@/shared/components/link"
import { Button } from "@/shared/ui/button"
import { Typography } from "@/shared/ui/typography"
import { sectionVariant, sectionVariantChild } from "@/shared/styles/variants"
import { getStaticObject } from "@/shared/lib/helpers"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

const introImage = getStaticObject("arts", "server-status-widget.webp")

export const HeroSection = () => {
  const hidden = useBlockHidden("hero")

  return (
    <Show when={!hidden()}>
      <div id="title" class={sectionVariant()}>
        <div class="absolute top-0 right-0 left-0 overflow-hidden h-full">
          <img
            src={introImage}
            alt=""
            fetchpriority="high"
            loading="eager"
            class="w-full h-full absolute top-0 right-0 left-0 object-cover brightness-65"
          />
          <div class="absolute inset-0
        bg-[linear-gradient(180deg,rgba(13,13,13,.5)_0%,rgba(13,13,13,.88)_65%,rgba(13,13,13,.95)_100%)]
        lg:bg-[linear-gradient(90deg,rgba(13,13,13,.92)_0%,rgba(13,13,13,.62)_45%,rgba(13,13,13,.12)_100%)]"
          />
        </div>
        <div class="flex items-center justify-start responsive z-1 mx-auto h-full">
          <div
            class="flex flex-col z-2 w-full px-2 sm:px-0 lg:w-[55%] gap-2
          sm:gap-4 justify-start items-start rounded-xl py-4 lg:py-6"
          >
            <div class="flex flex-col items-start justify-center w-full">
              <BlockTitle
                id="hero"
                fallback="Fasberry Project"
                as="h1"
                class={sectionVariantChild().title({ className: "text-pink-300" })}
              />
              <BlockSubtitle
                id="hero"
                fallback={translate["welcome.subtitle"]()}
                class={sectionVariantChild().subtitle({ className: "mb-4 text-balance" })}
              />
              <BlockControls id="hero" />
              <h3 class={sectionVariantChild().description({ className: "text-shadow-lg text-pretty" })}>
                {translate["welcome.description"]()}
              </h3>
              <div class="mt-2">
                <span class="text-sm text-neutral-300">
                  {translate["welcome.simple"]()}
                </span>
              </div>
            </div>
            <div class="flex w-full flex-col items-stretch gap-2 pt-1
            sm:flex-row sm:items-center">
              <Link href="/start" class="w-full sm:w-auto">
                <Button class="w-full px-8 py-1 sm:py-1">
                  <Typography color="white" class="text-nowrap text-sm sm:text-base text-shadow-xl">
                    {translate["welcome.action-text"]()}
                  </Typography>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}
