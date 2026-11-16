import { reatomComponent } from "@reatom/npm-react"
import NumberFlow from "@number-flow/react"
import { balanceState } from "../models/balance.model"

export const BalanceValue = reatomComponent<{ value: number, className?: string }>(({
  ctx, value, className
}) => {
  const animate = ctx.spy(balanceState.settings.animateBalance)

  return (
    <span className={className}>
      <NumberFlow
        animated={animate}
        value={value}
        trend={0}
        format={{ notation: "standard" }}
      />
    </span>
  )
}, "BalanceValue")
