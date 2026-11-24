import { Show } from "solid-js"
import { sectionVariant } from "@/shared/styles/variants"
import { translate } from "@/shared/locales/helpers"
import { SpawnCarousel } from "./spawn-carousel"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

export const SpawnSection = () => {
  const hidden = useBlockHidden("spawn")

  return (
    <Show when={!hidden()}>
      <div id="spawn" class={sectionVariant()}>
        <div class="flex flex-col items-center z-1 mx-auto responsive justify-center relative">
          <div class="flex flex-col gap-4 items-center justify-center
            h-full sm:overflow-hidden relative w-full">
            <div class="flex items-center justify-center h-full w-full">
              <SpawnCarousel />
            </div>
            <div
              class="flex flex-col backdrop-blur-sm p-4 transparent-achievement-panel
            w-full gap-2 z-21 lg:w-[60%] xl:w-[70%]"
            >
              <BlockTitle
                id="spawn"
                fallback={translate["spawn-server.title"]()}
                class="text-base sm:text-lg leading-6 text-center"
              />
              <BlockSubtitle
                id="spawn"
                fallback={translate["spawn-server.subtitle"]()}
                class="leading-5! text-sm sm:text-base text-center"
              />
              <BlockControls id="spawn" />
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}
