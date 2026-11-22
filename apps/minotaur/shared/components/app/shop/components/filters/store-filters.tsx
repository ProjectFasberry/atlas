import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { atom } from "@reatom/framework";
import { storeFiltersAtom, storeItems } from "../../models/store.model";
import { Icon } from "@/shared/ui/icon"
import { Input } from "@/shared/ui/input";
import { Vaul, VaulContent, VaulHeader, VaulTrigger } from "@/shared/ui/vaul";
import { translate } from "@/shared/locales/helpers";
import { CheckboxIndicatorIcon, checkboxVariant } from "@/shared/ui/checkbox";
import { Checkbox } from "@ark-ui/react/checkbox";

/** Filter values and the defaults they fall back to when unchecked. */
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
    <div className="flex h-10 items-center justify-start w-full relative">
      <Icon
        name="sprite:search"
        className="size-[18px] text-neutral-400 absolute left-2 sm:left-4"
      />
      <Input
        value={searchQuery}
        placeholder={translate["store.filters.placeholders.search"]()}
        className='w-full pl-8 sm:pl-12'
        onChange={e => storeItems.onChangeEvent(ctx, e)}
        maxLength={1024}
      />
    </div>
  )
}, "StoreSearch")

const StoreFilterItem = reatomComponent<{ filter: typeof FILTERS[number] }>(({ ctx, filter }) => {
  const current = ctx.spy(storeFiltersAtom)[filter.key]

  return (
    <div className="flex flex-col gap-2">
      <Typography className="text-neutral-400 text-lg">
        {translate[filter.title]()}
      </Typography>
      <div className='flex flex-col gap-2 w-full'>
        {filter.options.map((option) => (
          <Checkbox.Root
            key={option.value}
            id={`${filter.key}-${option.value}`}
            className={checkboxVariant.root("bg-neutral-800 px-2 h-8 rounded-lg w-full")}
            checked={current === option.value}
            onCheckedChange={(e) => {
              storeItems.setFilter(ctx, filter.key, e.checked ? option.value : filter.defaultValue)
            }}
          >
            <Checkbox.Control className={checkboxVariant.control({ variant: "filled" })} />
            <Checkbox.Label className={checkboxVariant.label()}>
              {translate[option.label]()}
            </Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        ))}
      </div>
    </div>
  )
}, "StoreFilterItem")

export const StoreFilterList = reatomComponent(() => (
  <>
    {FILTERS.map((filter) => <StoreFilterItem key={filter.key} filter={filter} />)}
  </>
), "StoreFilterList")

const storeFiltersIsOpenAtom = atom(false)

export const StoreFiltersSheet = () => {
  return (
    <Vaul openAtom={storeFiltersIsOpenAtom}>
      <VaulTrigger>
        <div className="flex bg-neutral-800 items-center justify-center rounded-xl h-10 aspect-square p-2 sm:p-3 lg:p-4">
          <Icon name="sprite:filter" className="size-5 text-neutral-400" />
        </div>
      </VaulTrigger>
      <VaulContent>
        <VaulHeader title={translate["store.filters.title"]()} />
        <div className='flex flex-col gap-6 w-full'>
          <StoreFilterList />
        </div>
      </VaulContent>
    </Vaul>
  )
}
