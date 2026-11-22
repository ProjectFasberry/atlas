import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { Skeleton } from "@/shared/ui/skeleton"
import { StoreItem } from "../items/store-item"
import { cart } from "../../models/store-cart.model"
import { translate } from "@/shared/locales/helpers"

/** Cross-sell block: other products that are not in the cart yet. */
export const CartSuggestions = reatomComponent(({ ctx }) => {
  useUpdate((innerCtx) => { cart.suggestions(innerCtx) }, [])

  const suggestions = ctx.spy(cart.suggestions.dataAtom)
  const pending = ctx.spy(cart.suggestions.statusesAtom).isPending

  if (pending && !suggestions) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={idx} className="h-56 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!suggestions?.length) return null

  return (
    <div className="flex flex-col gap-3">
      <Typography className="text-lg font-semibold">
        {translate["cart.suggestions.title"]()}
      </Typography>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {suggestions.map((item) => <StoreItem key={item.id} {...item} />)}
      </div>
    </div>
  )
}, "CartSuggestions")
