import { reatomComponent } from "@reatom/npm-react"
import { spawn } from "@reatom/framework"
import { toast } from "sonner"
import { Button } from "@/shared/ui/button"
import { Icon } from "@/shared/ui/icon"
import { Typography } from "@/shared/ui/typography"
import { Avatar } from "@/shared/ui/avatar"
import { createLink } from "@/shared/components/config/link/link.model"
import { getItemStatus, storeItem } from "../../models/store-item.model"
import { cart, cartDataItemIsSelectAtom, type CartItem as CartItemProps } from "../../models/store-cart.model"
import { changeLocalRecipient } from "../../../settings/models/settings-store.model"
import { getCurrencies } from "@/shared/models/shared.model"
import { Checkbox } from "@ark-ui/react/checkbox"
import { CheckboxIndicatorIcon, checkboxVariant } from "@/shared/ui/checkbox"
import { translate } from "@/shared/locales/helpers"

const CartItemSelect = reatomComponent<Pick<CartItemProps, "id" | "title">>(({ ctx, id, title }) => {
  const checked = ctx.spy(cartDataItemIsSelectAtom(id));

  return (
    <Checkbox.Root
      id={String(id)}
      aria-label={`${translate["cart.item.select"]()}: ${title}`}
      checked={checked}
      onCheckedChange={() => storeItem.updateSelectedStatus(ctx, id)}
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
  )
}, "CartItemSelect")

export const CartItem = reatomComponent<CartItemProps>(({
  ctx, ...item
}) => {
  const { id, title, imageUrl, description, price, currency, recipient } = item

  const currencies = getCurrencies(ctx);
  const currencyInfo = currencies[currency];
  const pending = ctx.spy(getItemStatus(id))?.isLoading ?? false;

  const remove = () => {
    spawn(ctx, async (spawnCtx) => {
      try {
        await cart.removeItem(spawnCtx, id);

        toast(translate["cart.actions.removed"](), {
          action: {
            label: translate["cart.actions.undo"](),
            onClick: () => { void cart.restoreItem(spawnCtx, { id, recipient }) },
          },
        })
      } catch {
        // the model already logs and toasts the failure
      }
    })
  }

  return (
    <div
      id={id.toString()}
      aria-busy={pending}
      className="flex items-center w-full relative gap-3 sm:gap-4 rounded-xl
      border border-neutral-800 bg-neutral-900/40 p-3 sm:p-4"
    >
      <CartItemSelect id={id} title={title} />
      <a
        href={createLink("store", id.toString())}
        target="_blank"
        rel="noreferrer"
        className="flex shrink-0 items-center justify-center
        overflow-hidden rounded-lg bg-neutral-800 size-16"
      >
        <img
          src={imageUrl}
          width={64}
          height={64}
          alt=""
          loading="lazy"
          className="select-none size-full object-cover"
        />
      </a>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <a
          href={createLink("store", id.toString())}
          target="_blank"
          rel="noreferrer"
          className="min-w-0"
        >
          <Typography className="truncate text-sm font-semibold sm:text-base">{title}</Typography>
          {description && (
            <Typography className="line-clamp-1 text-xs text-neutral-400 sm:text-sm">
              {description}
            </Typography>
          )}
        </a>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => changeLocalRecipient.openDialog(ctx, item)}
            aria-label={translate["cart.item.change-recipient"]()}
            title={translate["cart.item.change-recipient"]()}
            className="flex h-7 min-w-0 items-center gap-1.5 rounded-lg
            bg-neutral-800/70 px-2 text-xs text-neutral-300 duration-150
            hover:bg-neutral-700 hover:text-neutral-100"
          >
            <Avatar url="" nickname={recipient ?? "?"} className="size-4" />
            <span className="truncate">{recipient || translate["cart.item.self"]()}</span>
            <Icon name="sprite:gift" className="size-3.5 shrink-0 text-neutral-500" />
          </button>
          <Button
            title={translate["cart.item.remove"]()}
            aria-label={`${translate["cart.item.remove"]()}: ${title}`}
            background="default"
            size="headless"
            className="h-7 w-7 aspect-square text-neutral-400 hover:text-red"
            onClick={remove}
            disabled={pending}
          >
            <Icon name="sprite:trash" className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 self-start pt-1">
        <Typography className="text-sm font-semibold tabular-nums sm:text-base">{price}</Typography>
        {currencyInfo?.img ? (
          <img
            src={currencyInfo.img}
            draggable={false}
            alt={currencyInfo.symbol}
            className="size-5"
          />
        ) : (
          <span className="text-xs text-neutral-400">{currencyInfo?.symbol ?? currency}</span>
        )}
      </div>
    </div>
  )
}, "CartItem")
