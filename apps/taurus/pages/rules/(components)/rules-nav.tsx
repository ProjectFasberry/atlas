import { For, Show } from "solid-js"
import { translate } from "@/shared/locales/helpers"
import { rulesState, setRulesOpen, setRulesSearch } from "../(models)/rules.model"
import type { RuleCategory } from "../(models)/rules.format"
import { useAtomAccessor } from "@/shared/lib/utils"
import { reatomComponent } from "@/shared/lib/reatom"

/** Search box, category navigation and tags of the rules page. */
export const RulesNav = reatomComponent<{ categories: RuleCategory[]; tags: string[] }>(({ ctx, categories, tags }) => {
  const search = useAtomAccessor(rulesState.search)
  const open = useAtomAccessor(rulesState.open)

  const isSearching = () => search().trim().length > 0
  const allOpen = () => categories.length > 0 && open().length >= categories.length

  const toggleAll = () => {
    setRulesOpen(ctx, allOpen() ? [] : categories.map((category) => category.id))
  }

  return (
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
        <For each={categories}>
          {(category) => (
            <a
              href={`#${category.id}`}
              class="flex items-center justify-between gap-3 px-2 py-1.5
              text-sm text-neutral-300 transition-colors hover:bg-neutral-800/70 hover:text-white"
            >
              <span class="truncate">{category.title}</span>
              <span class="shrink-0 text-xs text-neutral-500 tabular-nums">{category.count}</span>
            </a>
          )}
        </For>
      </nav>
      <div class="flex gap-1.5 overflow-x-auto pb-1 lg:hidden scrollbar scrollbar-h-0 scrollbar-thumb-neutral-800">
        <For each={categories}>
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
      <Show when={tags.length > 0}>
        <div class="hidden flex-wrap gap-1 lg:flex">
          <For each={tags}>
            {(tag) => (
              <span class="border border-neutral-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                {tag}
              </span>
            )}
          </For>
        </div>
      </Show>
    </aside>
  )
}, "RulesNav")
