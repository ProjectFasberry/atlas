import { For, type Accessor } from "solid-js"
import { Accordion } from "@ark-ui/solid/accordion"
import { Typography } from "@/shared/ui/typography"
import { Link } from "@/shared/components/link"
import type { FaqDisplayItem } from "@/shared/api/faq"

type FaqAccordionProps = {
  items: FaqDisplayItem[]
  open: Accessor<string[]>
  onChange: (value: string[]) => void
}

export const FaqAccordion = (props: FaqAccordionProps) => (
  <Accordion.Root
    multiple
    collapsible
    value={props.open()}
    onValueChange={(details) => props.onChange(details.value)}
    class="flex w-full flex-col gap-2"
  >
    <For each={props.items}>
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
                {item.linkLabel ?? item.href}
              </Link>
            )}
          </Accordion.ItemContent>
        </Accordion.Item>
      )}
    </For>
  </Accordion.Root>
)
