import { reatomComponent, } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { tv } from "tailwind-variants";
import { selectedDonateDataAtom, storeItemState } from "@/shared/components/app/shop/models/store-item.model";
import { ItemPrice, ItemSelectToCart } from "@/shared/components/app/shop/components/items/store-item";
import { appState } from "@/shared/models/app/index.model";
import { Skeleton } from "@/shared/ui/skeleton";
import { Icon } from "@/shared/ui/icon";
import { PlayerCard } from "@/shared/ui/player-card";
import { currentUserState } from "@/shared/models/current-user/index.model";

const sectionVariant = tv({
  base: `bg-neutral-900 p-2! sm:p-4! rounded-xl w-full`,
  slots: {
    primary: "text-lg font-semibold leading-5 sm:text-xl",
    secondary: "leading-4 text-base font-medium sm:text-lg"
  }
})

const SelectedItemImage = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null;

  return (
    <div
      className="
        flex items-center justify-center bg-neutral-900 p-2 sm:p-4 rounded-xl
        overflow-hidden w-full lg:w-1/4 h-full
      "
    >
      <img
        src={data.imageUrl}
        className="aspect-square object-cover w-36 sm:w-64"
        loading="eager"
        alt={data.title}
      />
    </div>
  )
}, "SelectedItemImage")

const SelectedItemHeader = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null;

  return (
    <div
      id="header"
      className="flex flex-col w-full gap-1"
    >
      <Typography className={sectionVariant().primary()}>
        {data.title}
      </Typography>
    </div>
  )
}, "SelectedItemHeader")

const SelectedItemDescription = reatomComponent(({ ctx }) => {
  const html = ctx.spy(selectedDonateDataAtom)

  const isMobile = ctx.spy(appState.current.isMobile)
  const isExpanded = ctx.spy(storeItemState.isExpanded)

  return (
    <div id="desc" className="flex flex-col gap-1 w-full">
      <Typography className={sectionVariant().secondary()}>
        Описание
      </Typography>
      {html ? (
        <div
          className="relative rounded-xl overflow-hidden w-full"
          onClick={() => {
            if (!isMobile) return;
            storeItemState.isExpanded(ctx, (state) => !state)
          }}
          style={{
            cursor: isMobile ? "pointer" : "default",
          }}
        >
          <div
            id="content"
            dangerouslySetInnerHTML={{ __html: html }}
            className="tiptap p-0! duration-150 whitespace-pre-wrap"
          />
          <div
            className="
              absolute z-2 duration-300 bottom-0 left-0 right-0
              bg-gradient-to-t from-neutral-950 via-neutral-950/92 to-neutral-950/40 h-full
            "
            style={{
              opacity: isExpanded ? 0 : 1,
            }}
          />
          <div className="absolute z-3 flex items-center justify-center bottom-4 right-0 left-0">
            <Icon
              name="sprite:chevron-down"
              className="
              size-6 text-neutral-400 duration-150
            "
              style={{
                opacity: isExpanded ? 0 : 1,
              }}
            />
          </div>
        </div>
      ) : (
        <Skeleton className="h-46 w-full" />
      )}
    </div>
  )
}, "SelectedItemDescription")

const SelectedItemPrice = reatomComponent(({ ctx }) => {
  const data = ctx.spy(storeItemState.data)
  if (!data) return null;

  return (
    <div
      id="purchase"
      className="flex flex-col gap-1 w-full sm:w-1/4"
    >
      <div className={sectionVariant().base({ className: "flex flex-col items-center gap-4" })}>
        <div className="flex w-full">
          <ItemPrice
            currency={data.currency}
            price={{
              value: data.price,
              variant: {
                size: "large"
              }
            }}
          />
        </div>
        <div className="flex items-center gap-1 w-full">
          <ItemSelectToCart id={data.id} />
        </div>
      </div>
    </div>
  )
}, "SelectedItemPrice")

const SelectedItemBuyers = reatomComponent(({ ctx }) => {
  const currentUser = ctx.spy(currentUserState);
  if (!currentUser) return;

  return (
    <div className="flex flex-col w-full gap-2">
      <Typography className={sectionVariant().secondary()}>
        Последние покупатели
      </Typography>
      <div className="flex *:w-1/4 overflow-x-auto w-full gap-2 h-fit">
        <PlayerCard nickname={currentUser.nickname} avatar={currentUser.avatar}  />
      </div>
    </div>
  )
}, "SelectedItemBuyers")

export default function Page() {
  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div className="flex flex-col sm:flex-row items-start gap-6 w-full justify-center h-full">
        <SelectedItemImage />
        <div className="flex flex-col gap-6 w-full sm:w-2/4 h-full">
          <SelectedItemHeader />
          <SelectedItemDescription />
        </div>
        <SelectedItemPrice />
      </div>
      <SelectedItemBuyers/>
    </div>
  )
}
