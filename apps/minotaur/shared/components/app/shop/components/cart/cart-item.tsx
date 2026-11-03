import { reatomComponent } from "@reatom/npm-react"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { createLink } from "@/shared/components/config/link/link.model"
import { storeItem } from "../../models/store-item.model"
import { cart, cartDataItemIsSelectAtom, type CartItem as CartItemProps } from "../../models/store-cart.model"
import { changeLocalRecipient } from "../../../settings/models/settings-store.model"
import { getCurrencies } from "@/shared/models/shared.model"
import { Checkbox } from "@ark-ui/react/checkbox"
import { CheckboxIndicatorIcon, checkboxVariant } from "@/shared/ui/checkbox"
import { translate } from "@/shared/locales/helpers"

const CartItemRemoveFromCart = reatomComponent<{ id: number }>(({ ctx, id }) => {
  return (
    <Button
      title={translate["cart.item.remove"]()}
      aria-label={translate["cart.item.remove"]()}
      background="default"
      size="headless"
      className="h-11 min-h-11 w-11 aspect-square"
      onClick={() => cart.removeItem(ctx, id)}
      disabled={ctx.spy(cart.removeItem.statusesAtom).isPending}
    >
      <Icon name="sprite:trash" className="size-4" />
    </Button>
  )
}, "CartItemRemoveFromCart")

const CartItemUpdateSelectStatus = reatomComponent<{ id: number }>(({ ctx, id }) => {
  const checked = ctx.spy(cartDataItemIsSelectAtom(id));

  return (
    <div className="absolute z-2 top-3 left-3">
      <Checkbox.Root
        id={String(id)}
        aria-label={translate["cart.item.select"]()}
        checked={checked}
        onCheckedChange={(e) => storeItem.updateSelectedStatus(ctx, id)}
        className={checkboxVariant.root()}
        disabled={ctx.spy(storeItem.updateSelectedStatus.statusesAtom).isPending}
      >
        <Checkbox.Control className={checkboxVariant.control({ variant: "filled", size: "medium" })}>
          <Checkbox.Indicator className={checkboxVariant.indicator()}>
            <CheckboxIndicatorIcon />
          </Checkbox.Indicator>
        </Checkbox.Control>
        <Checkbox.HiddenInput />
      </Checkbox.Root>
    </div>
  )
}, "CartItemUpdateSelectStatus")

export const CartItem = reatomComponent<CartItemProps>(({
  ctx, ...item
}) => {
  const { id, title, imageUrl, description, price, currency } = item

  const currencies = getCurrencies(ctx);
  const currencyInfo = currencies[currency];

  return (
    <div
      id={id.toString()}
      className="flex items-center w-full relative gap-2 sm:gap-4 max-h-32 overflow-hidden rounded-lg p-2 sm:p-6
        border border-neutral-800"
    >
      <CartItemUpdateSelectStatus id={id} />
      <div className="flex items-center relative gap-2 sm:gap-4 min-w-0 flex-1">
        <div className="flex items-center justify-center overflow-hidden min-h-12 min-w-12 size-12">
          <img
            src={imageUrl}
            width={56}
            height={56}
            alt=""
            className="select-none w-full h-full"
          />
        </div>
        <div className="flex flex-col justify-center w-full gap-2">
          <a href={createLink("store", id.toString())} target="_blank" className="flex flex-col">
            <Typography className="text-md sm:text-base font-semibold truncate">
              {title}
            </Typography>
            <Typography className="text-neutral-400 line-clamp-1 leading-tight text-sm w-full">
              {description}
            </Typography>
          </a>
          <div className="flex items-center gap-1">
            <Button
              background="default"
              size="headless"
              aria-label={translate["cart.item.change-recipient"]()}
              title={translate["cart.item.change-recipient"]()}
              className="h-11 min-h-11 w-11 aspect-square"
              onClick={() => changeLocalRecipient.openDialog(ctx, item)}
            >
              <Icon name="sprite:gift" className="size-4" />
            </Button>
            <CartItemRemoveFromCart id={id} />
          </div>
        </div>
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1">
          <Typography className="font-semibold text-nowrap">
            {price}
          </Typography>
          {currencyInfo?.img ? (
            <img
              src={currencyInfo.img}
              draggable={false}
              alt={currencyInfo.symbol}
              className="w-5 h-5 inline-block"
            />
          ) : (
            <span className="text-sm text-neutral-400">
              {currencyInfo?.symbol ?? currency}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}, "CartItem")
