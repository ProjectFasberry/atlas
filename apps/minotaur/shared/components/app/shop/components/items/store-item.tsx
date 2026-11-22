import { Link } from "@/shared/components/config/link/link"
import { getStaticImage } from "@/shared/lib/helpers"
import { Typography } from "@/shared/ui/typography"
import { type StoreItem as StoreItemProps } from "../../models/store-item.model"
import { storeItemsState } from "../../models/store.model"
import { cart, cartContainsItemAtom } from "../../models/store-cart.model"
import { reatomComponent } from "@reatom/npm-react"
import { tv, type VariantProps } from "tailwind-variants"
import { Button } from "@/shared/ui/button"
import { createLink } from "@/shared/components/config/link/link.model"
import { getCurrencies } from "@/shared/models/shared.model"
import { translate } from "@/shared/locales/helpers"

const buyButtonVariants = tv({
  base: `group gap-2 duration-150 h-10 *:duration-150 px-6 w-full rounded-xl`,
  variants: {
    variant: {
      inCart: "bg-neutral-50 hover:bg-neutral-200",
      add: "bg-green-500/80"
    }
  },
  defaultVariants: {
    variant: "add"
  }
})

const buyButtonTypographyVariants = tv({
  base: `font-semibold text-base text-nowrap`,
  variants: {
    variant: {
      inCart: "text-neutral-900",
      add: "text-neutral-50"
    }
  },
  defaultVariants: {
    variant: "add"
  }
})

const storeItemVariant = tv({
  base: `flex flex-col items-center w-full overflow-hidden rounded-xl justify-between gap-2 p-2 sm:p-4 relative`,
  variants: {
    variant: {
      default: "bg-gradient-to-b from-neutral-800/80 via-neutral-800/70 to-neutral-800/60"
    }
  },
  slots: {
    avatarImg: "min-h-16 min-w-16",
    info: "flex flex-col w-full gap-1 overflow-hidden justify-center relative z-[2] items-center",
    footer: "flex flex-col mt-0 sm:mt-2 items-center relative z-[2] justify-center w-full gap-2",
    title: "text-lg lg:text-xl leading-tight font-semibold truncate text-white w-full text-center block whitespace-nowrap",
    summary: "truncate h-5 relative -top-1 text-xs sm:text-sm w-full text-center",
    priceWrapper: "flex items-center justify-center h-9 py-1 px-4 rounded-full"
  },
  defaultVariants: {
    variant: "default"
  }
})

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
    <div className="flex items-center gap-1 text-base select-none text-nowrap font-semibold">
      <Typography className={itemPriceVariant(price.variant)}>
        {price.value}
      </Typography>
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
    </div>
  )
}, "ItemPrice")

export const ItemSelectToCart = reatomComponent<Pick<StoreItemProps, "id">>(({ ctx, id }) => {
  // The cart list arrives in the SSR snapshot, so the real state renders before
  // hydration instead of a placeholder; `pending` only drives the spinner.
  const isInCart = ctx.spy(cartContainsItemAtom(id))
  const isLoading = ctx.spy(storeItemsState.pending).includes(id)
  const variant: "inCart" | "add" = isInCart ? "inCart" : "add"

  return (
    <Button
      className={buyButtonVariants({ variant })}
      disabled={isLoading}
      onClick={() => cart.toggle(ctx, id)}
      withSpinner={true}
      isLoading={isLoading}
    >
      <Typography className={buyButtonTypographyVariants({ variant })}>
        {isInCart ? translate["store.inCart"]() : translate["store.buy"]()}
      </Typography>
    </Button>
  )
}, "ItemSelectToCart")

const storeItemBgImage = getStaticImage("patterns/pattern_light.png")

export const StoreItem = ({
  description, id, title, price, imageUrl, currency
}: StoreItemProps) => {
  return (
    <div className={storeItemVariant().base()}>
      <div className="z-[1] select-none absolute w-full h-full">
        <img
          src={storeItemBgImage}
          draggable={false}
          width={600}
          height={600}
          alt=""
        />
      </div>
      <Link
        href={createLink("store", id)}
        className="flex relative z-[2] items-center justify-center rounded-lg"
      >
        <img
          src={imageUrl}
          draggable={false}
          width={64}
          height={64}
          alt=""
          className={storeItemVariant().avatarImg()}
        />
      </Link>
      <div className={storeItemVariant().info()}>
        <a
          href={createLink("store", id)}
          target="_blank"
          className="w-full overflow-hidden"
        >
          <Typography className={storeItemVariant().title()}>
            {title}
          </Typography>
        </a>
        <Typography color="gray" className={storeItemVariant().summary()}>
          {description}
        </Typography>
      </div>
      <div className={storeItemVariant().footer()}>
        <div className={storeItemVariant().priceWrapper({ className: "bg-blue-600" })}>
          <ItemPrice currency={currency} price={{ value: price }} />
        </div>
        <ItemSelectToCart id={id} />
      </div>
    </div>
  )
}

export const StoreItemRow = ({
  description, id, title, price, imageUrl, currency
}: StoreItemProps) => {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-neutral-900 p-3 sm:flex-row sm:items-center">
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
          <Link
            href={createLink("store", id)}
            className="truncate text-base font-semibold text-white
              duration-150 hover:text-neutral-300"
          >
            {title}
          </Link>
          <Typography color="gray" className="line-clamp-2 text-sm">{description}</Typography>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:shrink-0 sm:justify-end">
        <div className="flex h-9 items-center rounded-full bg-blue-600 px-4">
          <ItemPrice currency={currency} price={{ value: price }} />
        </div>
        <div className="w-32 sm:w-36">
          <ItemSelectToCart id={id} />
        </div>
      </div>
    </div>
  )
}
