import { reatomComponent } from "@reatom/npm-react"
import { Typography } from "@/shared/ui/typography"
import { cartState } from "../../models/store-cart.model"
import { getCurrencies } from "@/shared/models/shared.model"

export const CartPrice = reatomComponent(({ ctx }) => {
  const prices = ctx.spy(cartState.price)
  const currencies = getCurrencies(ctx);

  const totals = Object.entries(prices)
    .filter((entry): entry is [string, number] =>
      typeof entry[1] === "number" && entry[1] > 0
    )

  if (!totals.length) {
    return (
      <Typography className="text-lg leading-5 font-semibold">
        0
      </Typography>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {totals.map(([currency, value]) => {
        const { symbol, img } = currencies[currency] ?? { symbol: currency }

        return (
          <Typography key={currency} className="text-lg leading-5 font-semibold flex items-center gap-1">
            {img ? <img src={img} draggable={false} alt={symbol} className="w-5 h-5 inline-block" /> : symbol} {value}
          </Typography>
        )
      })}
    </div>
  )
}, "CartPrice")
