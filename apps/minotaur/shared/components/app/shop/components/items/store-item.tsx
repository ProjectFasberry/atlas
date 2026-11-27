import { Link } from "@/shared/components/config/link/link"
import { Typography } from "@/shared/ui/typography"
import { Icon } from "@/shared/ui/icon"
import { type StoreItem as StoreItemProps } from "../../models/store-item.model"
import { storeItemsState } from "../../models/store.model"
import { cart, cartContainsItemAtom } from "../../models/store-cart.model"
import { reatomComponent } from "@reatom/npm-react"
import { tv, type VariantProps } from "tailwind-variants"
import { Button } from "@/shared/ui/button"
import { createLink } from "@/shared/components/config/link/link.model"
import { getCurrencies } from "@/shared/models/shared.model"
import { translate } from "@/shared/locales/helpers"
import { navigate } from "vike/client/router"
import { storeItemTypeLabel, storeItemTypeTone } from "../../lib/labels"

const itemPriceVariant = tv({
  base: "",
  variants: {
    size: {
      sm: "text-sm",
      base: "text-base",
      large: "text-lg"
    }
  },
  defaultVariants: {
    size: "base"
  }
})

type ItemPriceProps = {
  currency: string,
  price: {
    value: string | number,
    variant?: VariantProps<typeof itemPriceVariant>
  }
}

export const ItemPrice = reatomComponent<ItemPriceProps>(({ ctx, price, currency }) => {
  const currencies = getCurrencies(ctx);
  const currencyInfo = currencies[currency];

  return (
    <span className="flex select-none items-center gap-1 whitespace-nowrap font-semibold">
      <span className={itemPriceVariant(price.variant)}>
        {price.value}
      </span>
      {currencyInfo?.img ? (
        <img
          src={currencyInfo.img}
          draggable={false}
          alt={currencyInfo.symbol}
          width={24}
          height={24}
        />
      ) : (
        <span>{currencyInfo?.symbol ?? currency}</span>
      )}
    </span>
  )
}, "ItemPrice")

/**
 * One action for both card variants: add to the cart, or open it when the item
 * is already there. Removing stays on the cart screen, where it is explicit.
 */
export const ItemSelectToCart = reatomComponent<
  Pick<StoreItemProps, "id"> & { className?: string }
>(({ ctx, id, className = "" }) => {
  const isInCart = ctx.spy(cartContainsItemAtom(id))
  const isLoading = ctx.spy(storeItemsState.pending).includes(id)

  if (isInCart) {
    return (
      <Button
        background="white"
        className={`h-10 w-full gap-1.5 px-4 text-sm font-semibold ${className}`}
        onClick={() => navigate("/store/cart")}
      >
        <Icon name="sprite:check" className="size-4" />
        {translate["store.inCart"]()}
      </Button>
    )
  }

  return (
    <Button
      background="positive"
      className={`h-10 w-full gap-1.5 px-4 text-sm font-semibold ${className}`}
      disabled={isLoading}
      withSpinner
      isLoading={isLoading}
      onClick={() => cart.addItem(ctx, id)}
    >
      {translate["store.buy"]()}
    </Button>
  )
}, "ItemSelectToCart")

export const StoreItem = ({
  description, id, title, price, imageUrl, currency, type
}: StoreItemProps) => {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900">
      <Link
        href={createLink("store", id)}
        className="relative flex aspect-5/3 items-center justify-center bg-neutral-800/50 p-4"
      >
        <img
          src={imageUrl}
          draggable={false}
          width={96}
          height={96}
          alt=""
          className="size-24 object-contain transition-transform duration-200 group-hover:scale-105"
        />
        <span className={`absolute left-2 top-2 rounded-md px-2 py-1 text-[10px] font-semibold
          uppercase tracking-wide ${storeItemTypeTone(type)}`}>
          {storeItemTypeLabel(type)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={createLink("store", id)} className="min-w-0">
          <h3 className="truncate text-base font-semibold text-white duration-150
            group-hover:text-neutral-200">
            {title}
          </h3>
        </Link>
        <p className="line-clamp-2 min-h-9 text-xs leading-4.5 text-neutral-400">
          {description}
        </p>
        <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex h-10 w-fit items-center rounded-full bg-neutral-800 px-3">
            <ItemPrice currency={currency} price={{ value: price }} />
          </span>
          <ItemSelectToCart id={id} className="w-full px-3 sm:w-auto" />
        </div>
      </div>
    </article>
  )
}

export const StoreItemRow = ({
  description, id, title, price, imageUrl, currency, type
}: StoreItemProps) => {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900 p-3
      sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href={createLink("store", id)}
          className="flex size-16 shrink-0 items-center justify-center rounded-lg bg-neutral-800"
        >
          <img
            src={imageUrl}
            draggable={false}
            width={56}
            height={56}
            alt=""
            className="size-14 object-contain"
          />
        </Link>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2">
            <Link
              href={createLink("store", id)}
              className="truncate text-base font-semibold text-white
                duration-150 hover:text-neutral-300"
            >
              {title}
            </Link>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold
              uppercase tracking-wide ${storeItemTypeTone(type)}`}>
              {storeItemTypeLabel(type)}
            </span>
          </div>
          <Typography color="gray" className="line-clamp-2 text-sm">{description}</Typography>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
        <span className="flex h-10 items-center rounded-full bg-neutral-800 px-4">
          <ItemPrice currency={currency} price={{ value: price }} />
        </span>
        <div className="w-32 sm:w-36">
          <ItemSelectToCart id={id} />
        </div>
      </div>
    </article>
  )
}
