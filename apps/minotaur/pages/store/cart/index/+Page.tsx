import { WithLoader } from "@/shared/components/app/layout/components/with-loader";
import { CartListContent } from "@/shared/components/app/shop/components/cart/cart-list";
import { CartActions } from "@/shared/components/app/shop/components/cart/cart-summary";
import { CartSuggestions } from "@/shared/components/app/shop/components/cart/cart-suggestions";
import { loaderIsActiveAtom } from "@/shared/components/app/shop/models/store-order.model";
import { Typography } from "@/shared/ui/typography"
import { translate } from "@/shared/locales/helpers"

export default function Page() {
  return (
    <WithLoader loaderAtom={loaderIsActiveAtom} title={translate["cart.loading"]()}>
      <div className="flex flex-col gap-6 w-full h-full pb-24 lg:pb-0">
        <Typography className="text-3xl font-semibold">
          {translate["cart.title"]()}
        </Typography>
        <div className="flex flex-col lg:flex-row items-start w-full gap-6 h-fit">
          <CartListContent />
          <CartActions />
        </div>
        <CartSuggestions />
      </div>
    </WithLoader>
  )
}
