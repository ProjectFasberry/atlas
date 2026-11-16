import { reatomComponent, useUpdate } from "@reatom/npm-react"
import { Skeleton } from "@/shared/ui/skeleton"
import { belkoinImage, charismImage } from "@/shared/consts/images"
import { translate } from "@/shared/locales/helpers"
import { balance, balanceState } from "../models/balance.model"
import { BalanceValue } from "./balance-value"

const ICON_SIZE = { sm: "size-5", md: "size-6", lg: "size-7" } as const
const VALUE_SIZE = { sm: "text-sm", md: "text-base", lg: "text-2xl" } as const
const SKELETON_SIZE = { sm: "h-4 w-14", md: "h-5 w-20", lg: "h-7 w-28" } as const

export const WalletChips = reatomComponent<{ size?: "sm" | "md" | "lg", masked?: boolean }>(({
  ctx, size = "sm", masked = false
}) => {
  useUpdate(balance.fetch, [])

  const isFirstPending = ctx.spy(balance.fetch.statusesAtom).isFirstPending
  const server = ctx.spy(balanceState.targetServer)

  const amount = (value: number) => masked
    ? <span className={`${VALUE_SIZE[size]} font-semibold text-neutral-50`}>••••</span>
    : <BalanceValue value={value} className={`${VALUE_SIZE[size]} font-semibold text-neutral-50`} />

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1.5">
        <img src={belkoinImage} alt="BELKOIN" className={ICON_SIZE[size]} />
        {isFirstPending && <Skeleton className={SKELETON_SIZE[size]} />}
        {!isFirstPending && amount(ctx.spy(balanceState.belkoinBalance))}
      </span>
      <span
        title={translate["wallet.charism_server"]({ server })}
        className="flex items-center gap-1.5"
      >
        <img src={charismImage} alt="CHARISM" className={ICON_SIZE[size]} />
        {isFirstPending && <Skeleton className={SKELETON_SIZE[size]} />}
        {!isFirstPending && amount(ctx.spy(balanceState.charismBalance))}
        <span className="text-[11px] font-medium capitalize text-neutral-500">{server}</span>
      </span>
    </div>
  )
}, "WalletChips")
