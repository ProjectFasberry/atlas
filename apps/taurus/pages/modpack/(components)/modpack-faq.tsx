import { Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"
import { modpackState, setModpackFaq } from "../(models)/modpack.model"
import type { Data } from "../+data"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"
import { FaqAccordion } from "@/shared/components/faq-accordion"
import { toFaqItems } from "@/shared/api/faq"

export const ModpackFaq = reatomComponent(({ ctx }) => {
  const faqOpen = useAtomAccessor(modpackState.faqOpen)
  const hidden = useBlockHidden("modpack-faq")
  const pageData = useData<Data>()
  const items = toFaqItems(pageData.faq)

  return (
    <Show when={!hidden() && items.length > 0}>
      <section class="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-10">
        <div class="flex flex-col gap-1">
          <BlockTitle
            id="modpack-faq"
            fallback={translate["modpack.faq.title"]()}
            class="text-xl sm:text-3xl lg:text-4xl"
          />
          <BlockSubtitle
            id="modpack-faq"
            fallback={translate["modpack.faq.subtitle"]()}
            class="text-sm sm:text-base"
          />
          <BlockControls id="modpack-faq" />
        </div>
        <FaqAccordion
          items={items}
          open={faqOpen}
          onChange={(value) => setModpackFaq(ctx, value)}
        />
      </section>
    </Show>
  )
}, "ModpackFaq")
