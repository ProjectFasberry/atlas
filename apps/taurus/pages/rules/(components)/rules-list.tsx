import { Accordion } from "@ark-ui/solid/accordion";
import { For, Show, createMemo, onMount } from "solid-js";
import { useData } from "vike-solid/useData";
import { dayjs } from "@/shared/lib/create-dayjs";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import type { Data } from "../+data";
import { rulesState, setRulesOpen, setRulesSearch } from "../(models)/rules.model";
import {
  getUpdatedDate, normalize, pointsLabel, textOf, type RawCategory
} from "../(models)/rules.format";
import { useAtomAccessor } from "@/shared/lib/utils";
import { reatomComponent } from "@/shared/lib/reatom";
import { RuleHtml } from "./rule-content";
import { RulesNav } from "./rules-nav";

export const RulesContent = reatomComponent(({ ctx }) => {
  const pageData = useData<Data>()?.data

  const search = useAtomAccessor(rulesState.search)
  const open = useAtomAccessor(rulesState.open)

  onMount(() => setRulesSearch(ctx, ""))

  const categories = createMemo(() => normalize((pageData?.content ?? []) as RawCategory[]))
  const tags = () => (pageData?.tags ?? []).map((tag) => tag.title).filter(Boolean)
  const query = () => search().trim().toLowerCase()
  const isSearching = () => query().length > 0

  const filtered = createMemo(() => {
    const value = query()
    if (!value) return categories()

    return categories()
      .map((category) => {
        const titleMatches = category.title.toLowerCase().includes(value)
        const blocks = titleMatches
          ? category.blocks
          : category.blocks.filter((block) => textOf(block).toLowerCase().includes(value))

        return { ...category, blocks }
      })
      .filter((category) => category.blocks.length > 0)
  })

  const openValues = () => isSearching() ? filtered().map((category) => category.id) : open()
  const total = () => categories().reduce((sum, category) => sum + category.count, 0)
  const updated = () => getUpdatedDate(categories())

  return (
    <div id="rules-list" class="flex flex-col gap-6">
      <div class="flex flex-col gap-2">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl">
          {translate["rules.content.title"]()}
        </h2>
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400 sm:text-sm">
          <span>{translate["rules.meta.sections"]({ count: categories().length })}</span>
          <span class="text-neutral-700">·</span>
          <span>{translate["rules.meta.points"]({ count: total() })}</span>
          <Show when={updated()}>
            {(date) => (
              <>
                <span class="text-neutral-700">·</span>
                <span>{translate["rules.meta.updated"]({ date: date() })}</span>
              </>
            )}
          </Show>
        </div>
      </div>
      <div class="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
        <RulesNav categories={categories()} tags={tags()} />
        <div class="min-w-0">
          <Show
            when={filtered().length > 0}
            fallback={
              <div class="transparent-achievement-panel flex flex-col items-center gap-3 p-6 text-center">
                <Typography color="gray" class="text-sm sm:text-base">
                  {translate["rules.search.empty"]()}
                </Typography>
                <button
                  type="button"
                  onClick={() => setRulesSearch(ctx, "")}
                  class="text-sm text-green-400 underline underline-offset-4"
                >
                  {translate["rules.search.clear"]()}
                </button>
              </div>
            }
          >
            <Accordion.Root
              multiple
              collapsible
              value={openValues()}
              onValueChange={(details) => {
                if (!isSearching()) setRulesOpen(ctx, details.value)
              }}
              class="flex flex-col gap-3"
            >
              <For each={filtered()}>
                {(category, index) => (
                  <div id={category.id} class="scroll-mt-24">
                    <Accordion.Item
                      value={category.id}
                      class="transparent-achievement-panel"
                    >
                      <Accordion.ItemTrigger class="flex w-full cursor-pointer items-center gap-3 p-3 text-left sm:p-4">
                        <span class="raised-slot flex h-9 w-9 shrink-0 items-center justify-center text-sm text-neutral-800">
                          {index() + 1}
                        </span>
                        <span class="flex min-w-0 flex-col gap-0.5">
                          <Typography color="white" class="text-lg sm:text-xl">
                            {category.title}
                          </Typography>
                          <span class="text-xs text-neutral-500">
                            {category.blocks.length} {pointsLabel(category.blocks.length)}
                          </span>
                        </span>
                        <Show when={!isSearching()}>
                          <Accordion.ItemIndicator class="group ml-auto shrink-0 text-xl text-green-400">
                            <span class="group-data-[state=open]:hidden">+</span>
                            <span class="hidden group-data-[state=open]:inline">−</span>
                          </Accordion.ItemIndicator>
                        </Show>
                      </Accordion.ItemTrigger>
                      <Accordion.ItemContent class="px-2 pb-3 sm:px-3 sm:pb-4">
                        <RuleHtml blocks={category.blocks} />
                        <Show when={category.updatedAt}>
                          {(date) => (
                            <div class="flex justify-end px-2 pt-1">
                              <Typography color="gray" class="text-xs">
                                {translate["rules.updated"]({ date: dayjs(date()).format("DD.MM.YYYY") })}
                              </Typography>
                            </div>
                          )}
                        </Show>
                      </Accordion.ItemContent>
                    </Accordion.Item>
                  </div>
                )}
              </For>
            </Accordion.Root>
          </Show>
        </div>
      </div>
    </div>
  )
}, "RulesContent")
