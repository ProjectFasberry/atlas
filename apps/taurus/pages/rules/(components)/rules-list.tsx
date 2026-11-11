import { Accordion } from "@ark-ui/solid/accordion";
import { useAtom, useCtx } from "@reatom/npm-solid-js";
import { For, Show, createMemo, onMount } from "solid-js";
import { useData } from "vike-solid/useData";
import { renderToHTMLString } from "@tiptap/static-renderer";
import type { JSONContent } from "@tiptap/core";
import { editorExtensions as extensions } from "@/shared/components/editor.model";
import { dayjs } from "@/shared/lib/create-dayjs";
import { Typography } from "@/shared/ui/typography";
import { translate } from "@/shared/locales/helpers";
import type { Data } from "../+data";
import { rulesState, setRulesOpen, setRulesSearch } from "../(models)/rules.model";

type RawCategory = {
  category?: string
  content?: JSONContent
  updated_at?: string | null
}

type RuleCategory = {
  id: string
  title: string
  blocks: JSONContent[]
  count: number
  updatedAt?: string | null
}

const textOf = (node?: JSONContent | null): string => {
  if (!node) return ""
  if (node.type === "text") return node.text ?? ""

  return (node.content ?? []).map(textOf).join(" ")
}

/**
 * The API stores some categories as one paragraph with several numbered rules
 * glued together (`1.1. ... 1.2. ...`). Split those into separate paragraphs so
 * the reader gets one rule per line.
 */
const splitDenseParagraph = (block: JSONContent): JSONContent[] => {
  if (block.type !== "paragraph") return [block]

  const text = textOf(block)
  const parts = text.split(/(?=\d+\.\d+\.)/).map((part) => part.trim()).filter(Boolean)

  if (parts.length <= 1) return [block]

  return parts.map((part) => ({
    type: "paragraph",
    content: [{ type: "text", text: part }]
  }))
}

const toBlocks = (doc?: JSONContent): JSONContent[] => {
  if (!Array.isArray(doc?.content)) return []

  return doc.content.flatMap(splitDenseParagraph)
}

const normalize = (raw: RawCategory[]): RuleCategory[] => raw.map((item, index) => {
  const blocks = toBlocks(item.content)

  return {
    id: `rules-${index}`,
    title: item.category ?? "",
    blocks,
    count: blocks.length,
    updatedAt: item.updated_at
  }
})

const pointsLabel = (count: number) => {
  const mod10 = count % 10
  const mod100 = count % 100

  if (mod10 === 1 && mod100 !== 11) return translate["rules.points.one"]()
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return translate["rules.points.few"]()

  return translate["rules.points.many"]()
}

const getUpdatedDate = (categories: RuleCategory[]): string | null => {
  const times = categories
    .map((category) => category.updatedAt)
    .filter((value): value is string => !!value)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite)

  if (!times.length) return null

  return dayjs(Math.max(...times)).format("DD.MM.YYYY")
}

const RuleHtml = (props: { blocks: JSONContent[] }) => {
  const html = createMemo(() => {
    const raw = renderToHTMLString({
      extensions,
      content: { type: "doc", content: props.blocks }
    })

    return raw
      .replace(/<p>(\d+(?:\.\d+)*)\./g, (_match, code: string) => {
        const id = `rule-${code.replace(/\./g, "-")}`
        return `<p id="${id}" class="rule-line">${code}.`
      })
      .replace(
        /<p id="(rule-[^"]+)"([^>]*)>([\s\S]*?)<\/p>/g,
        (_match, id: string, attrs: string, inner: string) =>
          `<p id="${id}"${attrs}>${inner}<a class="rule-anchor" href="#${id}" aria-label="${translate["rules.anchor"]()}">#</a></p>`
      )
  })

  return (
    <div
      class="tiptap rules-content whitespace-pre-wrap"
      innerHTML={html()}
    />
  )
}

export const RulesContent = () => {
  const ctx = useCtx()
  const pageData = useData<Data>()?.data

  const [search] = useAtom(rulesState.search)
  const [open] = useAtom(rulesState.open)

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
  const allOpen = () => categories().length > 0 && open().length >= categories().length
  const total = () => categories().reduce((sum, category) => sum + category.count, 0)
  const updated = () => getUpdatedDate(categories())

  const toggleAll = () => {
    setRulesOpen(ctx, allOpen() ? [] : categories().map((category) => category.id))
  }

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
        <aside class="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div class="flex flex-col gap-2">
            <div class="relative">
              <input
                type="text"
                value={search()}
                onInput={(event) => setRulesSearch(ctx, event.currentTarget.value)}
                placeholder={translate["rules.search.placeholder"]()}
                aria-label={translate["rules.search.placeholder"]()}
                class="anvil-textbox w-full bg-transparent px-4 py-2.5 pr-10 text-sm text-neutral-900 placeholder:text-neutral-600 outline-none"
              />
              <Show when={search()}>
                <button
                  type="button"
                  onClick={() => setRulesSearch(ctx, "")}
                  aria-label={translate["rules.search.clear"]()}
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-700 hover:text-black"
                >
                  <span class="block rotate-45 text-xl leading-none">+</span>
                </button>
              </Show>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-[10px] uppercase tracking-wider text-neutral-500">
                {translate["rules.nav.title"]()}
              </span>
              <Show when={!isSearching()}>
                <button
                  type="button"
                  onClick={toggleAll}
                  class="text-xs text-green-400 underline-offset-4 hover:underline"
                >
                  {allOpen() ? translate["rules.nav.collapse"]() : translate["rules.nav.expand"]()}
                </button>
              </Show>
            </div>
          </div>

          <nav class="hidden flex-col gap-1 lg:flex">
            <For each={categories()}>
              {(category) => (
                <a
                  href={`#${category.id}`}
                  class="flex items-center justify-between gap-3 px-2 py-1.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-800/70 hover:text-white"
                >
                  <span class="truncate">{category.title}</span>
                  <span class="shrink-0 text-xs text-neutral-500 tabular-nums">{category.count}</span>
                </a>
              )}
            </For>
          </nav>

          <div class="flex gap-1.5 overflow-x-auto pb-1 lg:hidden scrollbar scrollbar-h-0 scrollbar-thumb-neutral-800">
            <For each={categories()}>
              {(category) => (
                <a
                  href={`#${category.id}`}
                  class="raised-slot shrink-0 px-3 py-1.5 text-xs text-neutral-800"
                >
                  {category.title} · {category.count}
                </a>
              )}
            </For>
          </div>

          <Show when={tags().length > 0}>
            <div class="hidden flex-wrap gap-1 lg:flex">
              <For each={tags()}>
                {(tag) => (
                  <span class="border border-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                    {tag}
                  </span>
                )}
              </For>
            </div>
          </Show>
        </aside>

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
                          <Accordion.ItemIndicator class="ml-auto shrink-0 text-xl text-green-400 transition-transform duration-200 data-[state=open]:rotate-45">
                            +
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
}
