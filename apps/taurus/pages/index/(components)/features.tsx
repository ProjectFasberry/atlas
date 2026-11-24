import { Show } from "solid-js"
import { Link } from "@/shared/components/link"
import { sectionVariant } from "@/shared/styles/variants"
import { translate } from "@/shared/locales/helpers"
import { IdeaPreviewCard, IdeasNav } from "./gameplay"
import { BlockControls, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

export const FeaturesSection = () => {
  const hidden = useBlockHidden("features")

  return (
    <Show when={!hidden()}>
      <div id="features" class={sectionVariant()}>
        <div class="flex flex-col items-center mx-auto responsive gap-6 justify-center relative">
          <BlockTitle
            id="features"
            fallback={translate["features.title"]()}
            class="text-xl text-center sm:text-3xl lg:text-4xl"
          />
          <BlockControls id="features" />
          <IdeasNav />
          <IdeaPreviewCard />
          <Link href="/servers" class="w-fit">
            <span class="button inline-flex items-center px-4 py-2 text-sm font-semibold text-white">
              {translate["features.more"]()}
            </span>
          </Link>
        </div>
      </div>
    </Show>
  )
}
