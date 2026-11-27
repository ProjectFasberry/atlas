import { useData } from "vike-solid/useData";
import { translate } from "@/shared/locales/helpers";
import { faqOpenAtom, setFaqOpen } from "../(models)/faq.model";
import { toFaqItems } from "@/shared/api/faq";
import type { Data } from "../+data";
import { useAtomAccessor } from "@/shared/lib/utils";
import { FaqAccordion } from "@/shared/components/faq-accordion"
import { reatomComponent } from "@/shared/lib/reatom";
import {
  BlockControls, BlockSubtitle, BlockTitle, useBlockHidden
} from "@/shared/components/edit/section-block";

export const FaqSection = reatomComponent(({ ctx }) => {
  const open = useAtomAccessor(faqOpenAtom)
  const hidden = useBlockHidden("faq")
  const pageData = useData<Data>()

  const items = toFaqItems(pageData.faq)

  if (hidden() || items.length === 0) return null

  return (
    <div id="faq" class="section-edge relative flex w-full flex-col items-center py-16 sm:py-20 lg:py-28">
      <div class="responsive z-1 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
        <div class="flex flex-col gap-1">
          <BlockTitle
            id="faq"
            fallback={translate["faq.title"]()}
            class="text-xl sm:text-3xl lg:text-4xl"
          />
          <BlockSubtitle
            id="faq"
            fallback={translate["faq.subtitle"]()}
            class="text-sm sm:text-base"
          />
          <BlockControls id="faq" />
        </div>
        <FaqAccordion
          items={items}
          open={open}
          onChange={(value) => setFaqOpen(ctx, value)}
        />
      </div>
    </div>
  )
}, "FaqSection")
