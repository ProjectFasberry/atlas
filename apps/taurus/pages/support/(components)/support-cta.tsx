import { Show } from "solid-js"
import { Link } from "@/shared/components/link"
import { Typography } from "@/shared/ui/typography"
import { Button } from "@/shared/ui/button"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

export const SupportCta = () => {
  const hidden = useBlockHidden("support-cta")

  return (
    <Show when={!hidden()}>
      <section class="transparent-achievement-panel flex flex-col items-center justify-between gap-4 p-4 sm:flex-row sm:p-5">
        <div class="flex flex-col gap-1">
          <BlockTitle
            id="support-cta"
            fallback={translate["support.cta.title"]()}
            class="text-xl"
          />
          <BlockSubtitle
            id="support-cta"
            fallback={translate["support.cta.description"]()}
            class="text-sm"
          />
          <BlockControls id="support-cta" />
        </div>
        <div class="flex w-full gap-2 sm:w-auto">
          <Link href="/discord" class="flex-1 sm:flex-none">
            <Button class="w-full px-5 py-1">
              <Typography color="white" class="text-sm sm:text-base">
                {translate["support.cta.discord"]()}
              </Typography>
            </Button>
          </Link>
          <Link href="/telegram" class="flex-1 sm:flex-none">
            <Button class="w-full px-5 py-1">
              <Typography color="white" class="text-sm sm:text-base">
                {translate["support.cta.telegram"]()}
              </Typography>
            </Button>
          </Link>
        </div>
      </section>
    </Show>
  )
}
