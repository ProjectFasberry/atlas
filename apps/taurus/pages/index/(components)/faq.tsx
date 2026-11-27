import { Accordion } from "@ark-ui/solid/accordion";
import { For } from "solid-js";
import { useData } from "vike-solid/useData";
import { Typography } from "@/shared/ui/typography";
import { Link } from "@/shared/components/link";
import { translate } from "@/shared/locales/helpers";
import { faqOpenAtom, setFaqOpen, type FaqItem } from "../(models)/faq.model";
import type { Data } from "..//+data";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";
import {
  BlockControls, BlockSubtitle, BlockTitle, useBlockHidden
} from "@/shared/components/edit/section-block";

export const FaqSection = reatomComponent(({ ctx }) => {
  const open = useAtomAccessor(faqOpenAtom)
  const hidden = useBlockHidden("faq")
  const pageData = useData<Data>()

  const items: FaqItem[] = pageData.faq.map((item) => ({
    value: String(item.position),
    question: item.question,
    answer: item.answer,
    href: item.linkHref,
    linkLabel: item.linkLabel,
  }))

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
        <Accordion.Root
          multiple
          collapsible
          value={open()}
          onValueChange={(details) => setFaqOpen(ctx, details.value)}
          class="flex w-full flex-col gap-2"
        >
          <For each={items}>
            {(item) => (
              <Accordion.Item value={item.value} class="transparent-achievement-panel">
                <Accordion.ItemTrigger class="flex w-full cursor-pointer
                  items-center justify-between gap-4 p-3 text-left sm:p-4">
                  <Typography color="white" class="text-sm sm:text-base">
                    {item.question}
                  </Typography>
                  <Accordion.ItemIndicator class="group shrink-0 text-lg text-green-400">
                    <span class="group-data-[state=open]:hidden">+</span>
                    <span class="hidden group-data-[state=open]:inline">−</span>
                  </Accordion.ItemIndicator>
                </Accordion.ItemTrigger>
                <Accordion.ItemContent class="px-3 pb-3 sm:px-4 sm:pb-4">
                  <Typography color="gray" class="text-xs leading-5 sm:text-sm sm:leading-6">
                    {item.answer}
                  </Typography>
                  {item.href && (
                    <Link
                      href={item.href}
                      class="mt-2 inline-flex text-xs font-semibold text-green-400 underline underline-offset-4 hover:text-green-300"
                    >
                      {item.linkLabel}
                    </Link>
                  )}
                </Accordion.ItemContent>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </div>
    </div>
  )
}, "FaqSection")
