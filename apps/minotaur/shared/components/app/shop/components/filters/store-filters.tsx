import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { atom } from "@reatom/framework";
import { storeFiltersAtom, storeItems } from "../../models/store.model";
import { Icon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input";
import { Vaul, VaulContent, VaulHeader, VaulTrigger } from "@/shared/ui/vaul";
import { translate } from "@/shared/locales/helpers";

/** Filter values and the defaults they fall back to when a chip is toggled off. */
const FILTERS = [
  {
    key: "category",
    defaultValue: "all",
    title: "store.filters.type.label",
    options: [
      { value: "all", label: "store.filters.type.variants.all" },
      { value: "donate", label: "store.filters.type.variants.donate" },
      { value: "event", label: "store.filters.type.variants.event" },
    ],
  },
  {
    key: "wallet",
    defaultValue: "ALL",
    title: "store.filters.wallet.label",
    options: [
      { value: "ALL", label: "store.filters.wallet.variants.all" },
      { value: "CHARISM", label: "store.filters.wallet.variants.charism" },
      { value: "BELKOIN", label: "store.filters.wallet.variants.belkoin" },
    ],
  },
] as const

export const StoreSearch = reatomComponent(({ ctx }) => {
  const { searchQuery } = ctx.spy(storeFiltersAtom)

  return (
    <div className="relative flex h-10 w-full items-center">
      <Icon
        name="sprite:search"
        className="pointer-events-none absolute left-3 size-[18px] text-neutral-500"
      />
      <Input
        value={searchQuery}
        aria-label={translate["store.filters.placeholders.search"]()}
        placeholder={translate["store.filters.placeholders.search"]()}
        className="w-full pl-10 pr-10"
        onChange={e => storeItems.onChangeEvent(ctx, e)}
        maxLength={128}
      />
      {searchQuery.length > 0 && (
        <button
          type="button"
          aria-label={translate["store.filters.clear"]()}
          className="absolute right-2 flex size-7 items-center justify-center rounded-lg
            text-neutral-400 duration-150 hover:bg-neutral-800 hover:text-neutral-100"
          onClick={() => storeItems.setSearch(ctx, "")}
        >
          <Icon name="sprite:x" className="size-4" />
        </button>
      )}
    </div>
  )
}, "StoreSearch")

const StoreFilterItem = reatomComponent<{ filter: typeof FILTERS[number] }>(({ ctx, filter }) => {
  const current = ctx.spy(storeFiltersAtom)[filter.key]

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="text-lg text-neutral-400">
        {translate[filter.title]()}
      </legend>
      <div className="flex flex-wrap gap-1">
        {filter.options.map((option) => {
          const active = current === option.value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => storeItems.setFilter(
                ctx,
                filter.key,
                active ? filter.defaultValue : option.value,
              )}
              className={`h-9 rounded-lg px-3 text-sm font-medium duration-150
                focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400
                ${active
                  ? "bg-neutral-50 text-neutral-950"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-neutral-100"
                }`}
            >
              {translate[option.label]()}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}, "StoreFilterItem")

export const StoreFilterList = reatomComponent(() => (
  <>
    {FILTERS.map((filter) => <StoreFilterItem key={filter.key} filter={filter} />)}
  </>
), "StoreFilterList")

const storeFiltersIsOpenAtom = atom(false)

export const StoreFiltersSheet = reatomComponent(({ ctx }) => {
  const filters = ctx.spy(storeFiltersAtom)
  const activeCount = [
    filters.category !== "all",
    filters.wallet !== "ALL",
    filters.searchQuery.trim().length > 0,
  ].filter(Boolean).length

  return (
    <Vaul openAtom={storeFiltersIsOpenAtom}>
      <VaulTrigger asChild>
        <button
          type="button"
          aria-label={translate["store.filters.title"]()}
          className="relative flex h-10 aspect-square items-center justify-center
            rounded-xl bg-neutral-800 duration-150 hover:bg-neutral-700"
        >
          <Icon name="sprite:filter" className="size-5 text-neutral-300" />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center
              rounded-full bg-green-500 text-[10px] font-semibold text-neutral-950">
              {activeCount}
            </span>
          )}
        </button>
      </VaulTrigger>
      <VaulContent>
        <VaulHeader title={translate["store.filters.title"]()} />
        <div className='flex flex-col gap-6 w-full'>
          <StoreFilterList />
        </div>
      </VaulContent>
    </Vaul>
  )
}, "StoreFiltersSheet")
