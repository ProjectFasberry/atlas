import { Accordion } from "@ark-ui/solid/accordion";
import { For } from "solid-js";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import { createFaqItems, faqOpenAtom, setFaqOpen } from "../(models)/faq.model";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";

export const FaqSection = reatomComponent(({ ctx }) => {
  const open = useAtomAccessor(faqOpenAtom)

  return (
    <div id="faq" class="section-edge relative flex w-full flex-col items-center py-16 sm:py-20 lg:py-28">
      <div class="responsive z-1 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:gap-12">
        <div class="flex flex-col gap-1">
          <Typography color="white" class="text-2xl sm:text-3xl lg:text-4xl">
            {translate["faq.title"]()}
          </Typography>
          <Typography color="gray" class="text-sm sm:text-base">
            {translate["faq.subtitle"]()}
          </Typography>
        </div>
        <Accordion.Root
          multiple
          collapsible
          value={open()}
          onValueChange={(details) => setFaqOpen(ctx, details.value)}
          class="flex w-full flex-col gap-2"
        >
          <For each={createFaqItems()}>
            {(item) => (
              <Accordion.Item value={item.value} class="transparent-achievement-panel">
                <Accordion.ItemTrigger class="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left sm:p-4">
                  <Typography color="white" class="text-sm sm:text-base">
                    {item.question}
                  </Typography>
                  <Accordion.ItemIndicator class="shrink-0 text-lg text-green-400 transition-transform duration-200 data-[state=open]:rotate-45">
                    +
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent class="px-3 pb-3 sm:px-4 sm:pb-4">
                  <Typography color="gray" class="text-xs leading-5 sm:text-sm sm:leading-6">
                    {item.answer}
                  </Typography>
                </Accordion.ItemContent>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </div>
    </div>
  )
}, "FaqSection")
