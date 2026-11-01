import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { atom, type Ctx } from "@reatom/framework";
import { type Filter, filterIsAppliedAtom, filtersState, storeItems, storeItemsState } from "../../models/store.model";
import { Icon } from "@/shared/ui/icon"
import { pageState } from "@/shared/models/page-context.model";
import { Input } from "@/shared/ui/input";
import { Vaul, VaulContent, VaulHeader, VaulTrigger } from "@/shared/ui/vaul";
import { translate } from "@/shared/locales/helpers";
import { CheckboxIndicatorIcon, checkboxVariant } from "@/shared/ui/checkbox";
import { Checkbox } from "@ark-ui/react/checkbox";

export const StoreSearch = reatomComponent(({ ctx }) => {
  const searchQuery = ctx.spy(pageState.isClientside)
    ? ctx.spy(storeItemsState.filters.searchQuery)
    : storeItemsState.filters.all.get(ctx, "searchQuery")

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

const StoreFilterItem = reatomComponent<Omit<Filter, "atom">>(({
  ctx, title, filters, updater, origin
}) => {
  const handle = (
    updater: (ctx: Ctx, value: string) => void,
    isChecked: string | boolean,
    target: string
  ) => {
    if (typeof isChecked !== 'boolean') return;
    updater(ctx, isChecked ? target : "ALL");
  }

  const getUniqueFilterId = (v1: string, v2: string) => `${v1}${v2}`

  return (
    <div className="flex flex-col gap-2">
      <Typography className="text-neutral-400 text-lg">
        {title}
      </Typography>
      <div className='flex flex-col gap-2 w-full'>
        {filters.map((filter, idx) => (
          <Checkbox.Root
            key={idx}
            id={getUniqueFilterId(origin, filter.value)}
            className={checkboxVariant.root("bg-neutral-800 px-2 h-8 rounded-lg w-full")}
            checked={ctx.spy(filterIsAppliedAtom({ origin, currValue: filter.value }))}
            onCheckedChange={(e) => handle(updater, e.checked, filter.value)}
          >
            <Checkbox.Control className={checkboxVariant.control({ variant: "filled" })} />
            <Checkbox.Label className={checkboxVariant.label()}>
              {filter.name}
            </Checkbox.Label>
            <Checkbox.HiddenInput />
          </Checkbox.Root>
        ))}
      </div>
    </div>
  )
}, "StoreFilterItem")

export const StoreFilterList = reatomComponent(({ ctx }) =>
  ctx.spy(filtersState.data).map((item) => <StoreFilterItem key={item.origin} {...item} />),
  "StoreFilterList"
)

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
