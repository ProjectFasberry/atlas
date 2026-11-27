import { Accordion } from "@ark-ui/solid/accordion"
import { For, Show } from "solid-js"
import { useData } from "vike-solid/useData"
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"
import { BlockControls, BlockSubtitle, BlockTitle, useBlockHidden } from "@/shared/components/edit/section-block"
import { modpackState, setModpackFaq } from "../(models)/modpack.model"
import type { Data } from "../+data"
import { reatomComponent } from "@/shared/lib/reatom"
import { useAtomAccessor } from "@/shared/lib/utils"

export const ModpackFaq = reatomComponent(({ ctx }) => {
  const faqOpen = useAtomAccessor(modpackState.faqOpen)
  const hidden = useBlockHidden("modpack-faq")
  const pageData = useData<Data>()
  const items = pageData.faq.map((item) => ({ value: String(item.position), ...item }))

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
        <Accordion.Root
          multiple
          collapsible
          value={faqOpen()}
          onValueChange={(details) => setModpackFaq(ctx, details.value)}
          class="flex w-full flex-col gap-2"
        >
          <For each={items}>
            {(item) => (
              <Accordion.Item value={item.value} class="transparent-achievement-panel">
                <Accordion.ItemTrigger class="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left sm:p-4">
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
                </Accordion.ItemContent>
              </Accordion.Item>
            )}
          </For>
        </Accordion.Root>
      </section>
    </Show>
  )
}, "ModpackFaq")
