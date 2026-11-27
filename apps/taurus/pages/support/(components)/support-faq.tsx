import { Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { translate } from "@/shared/locales/helpers"
import { setSupportFaq, supportState } from "../(models)/support.model"
import type { Data } from "../+data"
import { useAtomAccessor } from "@/shared/lib/utils"
import { FaqAccordion } from "@/shared/components/faq-accordion"
import { toFaqItems } from "@/shared/api/faq"
import { reatomComponent } from "@/shared/lib/reatom"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"

export const SupportFaq = reatomComponent(({ ctx }) => {
  const faqOpen = useAtomAccessor(supportState.faqOpen)
  const hidden = useBlockHidden("support-faq")
  const pageData = useData<Data>()
  const items = toFaqItems(pageData.faq)

  return (
    <Show when={!hidden() && items.length > 0}>
      <section class="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-10">
        <div class="flex flex-col gap-1">
          <BlockTitle
            id="support-faq"
            fallback={translate["support.faq.title"]()}
            class="text-xl sm:text-3xl lg:text-4xl"
          />
          <BlockSubtitle
            id="support-faq"
            fallback={translate["support.faq.subtitle"]()}
            class="text-sm sm:text-base"
          />
          <BlockControls id="support-faq" />
        </div>
        <FaqAccordion
          items={items}
          open={faqOpen}
          onChange={(value) => setSupportFaq(ctx, value)}
        />
      </section>
    </Show>
  )
}, "SupportFaq")
