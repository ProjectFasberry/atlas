import { reatomComponent } from "@reatom/npm-react";
import { Typography } from "@/shared/ui/typography"
import { cartIsValidAtom, cartDataSelectedAtom, cartState, cartDataIsEmptyAtom } from "../../models/store-cart.model";
import { CartPrice } from "./cart-price";
import { Link } from "@/shared/components/config/link/link";
import { Button } from "@/shared/ui/button";
import { spawn } from "@reatom/framework";
import { CartItem } from "./cart-item";
import { ChangeRecipientDialog } from "../recipient/change-recipient";
import { Icon } from "@/shared/ui/icon"
import { expImage } from "@/shared/consts/images";
import { order } from "../../models/store-order.model";
import { translate } from "@/shared/locales/helpers";

const CartContentData = reatomComponent(({ ctx }) => {
  const data = ctx.spy(cartState.data);

  return (
    <div className="flex flex-col gap-4 w-full">
      <ChangeRecipientDialog />
      {data.map(item => <CartItem key={item.id} {...item} />)}
    </div>
  )
}, "CartContentData")

const CartSummerySelected = reatomComponent(({ ctx }) => ctx.spy(cartDataSelectedAtom).length, "CartSummerySelected")
const CartSummeryTotal = reatomComponent(({ ctx }) => ctx.spy(cartState.data).length, "CartSummery")

const CartActionsSubmit = reatomComponent(({ ctx }) => {
  const isValid = ctx.spy(cartIsValidAtom);
  const isPending = ctx.spy(order.create.statusesAtom).isPending;

  return (
    <Button
      id="submit"
      type="button"
      background="positive"
      disabled={!isValid || isPending}
      withSpinner
      isLoading={isPending}
      className="w-full h-10 font-semibold"
      onClick={() => spawn(ctx, (spawnCtx) => order.create(spawnCtx))}
    >
      {translate["cart.content.submit"]()}
    </Button>
  )
}, "CartActionsSubmit")

const CartContentEmpty = () => {
  return (
    <div className="flex flex-col bg-neutral-900 rounded-lg p-4 sm:p-3 lg:p-4 lg:w-2/3">
      <Typography className='text-2xl font-semibold'>
        {translate["cart.content.empty.title"]()}
      </Typography>
      <Typography className="text-neutral-400 text-base leading-5">
        {translate["cart.content.empty.description"]()}
      </Typography>
      <Link href="/store" className="mt-4 text-lg w-fit text-green-400">
        {translate["cart.content.empty.to-store"]()}
      </Link>
    </div>
  )
}

export const CartListContent = reatomComponent(({ ctx }) => {
  const isEmpty = ctx.spy(cartDataIsEmptyAtom);
  if (isEmpty) return <CartContentEmpty />;

  return (
    <div className="flex flex-col gap-4 lg:w-2/3 bg-neutral-900 p-2 sm:p-3 lg:p-4 rounded-xl">
      <div className="flex flex-col gap-1">
        <Typography className="text-xl font-semibold">
          {translate["cart.content.title"]()}
        </Typography>
        <div className="flex items-center justify-between w-full gap-2">
          <Typography className="text-neutral-400">
            {translate["cart.content.items"]()}: <CartSummeryTotal />
          </Typography>
          <Typography className="text-neutral-400">
            {translate["cart.content.selected"]()}: <CartSummerySelected />
          </Typography>
        </div>
      </div>
      <CartContentData />
    </div>
  )
}, 'CartListContent')

export const CartActions = () => {
  return (
    <div className="flex flex-col lg:w-1/3 bg-neutral-900 gap-4 p-2 sm:p-3 lg:p-4 rounded-xl w-full">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center w-full gap-2">
          <div className="flex-1 flex w-full">
            <CartActionsSubmit />
          </div>
          <div className="flex-1 flex w-full">
            <Link
              href="/store/cart/topup"
              className="
                flex-1 flex rounded-xl items-center justify-center
                bg-neutral-50 text-neutral-950 font-semibold
                text-nowrap truncate gap-1 min-w-0 h-10
              "
            >
              <Icon name="sprite:credit-card-pay" className="size-5" />
              {translate["cart.content.top-up"]()}
            </Link>
          </div>
        </div>
        <div
          className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full h-full"
        >
          <div className="flex items-start gap-2 justify-center w-fit rounded-lg">
            <div className="flex items-center justify-center bg-neutral-600/40 p-2 rounded-lg">
              <img
                src={expImage}
                loading="lazy"
                width={32}
                height={32}
                alt=""
                draggable={false}
              />
            </div>
            <div className="flex flex-col justify-center">
              <Typography color="gray" className="text-lg leading-6">
                {translate["cart.content.price"]()}
              </Typography>
              <CartPrice />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
