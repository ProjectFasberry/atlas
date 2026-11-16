import { reatomComponent } from "@reatom/npm-react"
import type { Atom } from "@reatom/framework"
import { Typography } from "@/shared/ui/typography"
import { Skeleton } from "@/shared/ui/skeleton"
import { getFromDictionary } from "@/shared/models/app/utils"
import { translate } from "@/shared/locales/helpers"
import { balance, balanceState } from "../models/balance.model"
import { BalanceValue } from "./balance-value"

type WalletCurrencyProps = {
  wallet: "BELKOIN" | "CHARISM"
  atom: Atom<number>
  image: string
  hint: string
  serverScoped?: boolean
}

export const WalletCurrency = reatomComponent<WalletCurrencyProps>(({
  ctx, wallet, atom, image, hint, serverScoped = false
}) => {
  const isFirstPending = ctx.spy(balance.fetch.statusesAtom).isFirstPending
  const serverUnavailable = serverScoped && !ctx.spy(balanceState.serverAvailable)
  const value = ctx.spy(atom)
  const badge = serverScoped ? ctx.spy(balanceState.targetServer) : translate["wallet.global"]()

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex items-center gap-2">
        <img src={image} alt={wallet} className="size-7 shrink-0" />
        <Typography className="truncate text-sm font-semibold text-neutral-200">
          {getFromDictionary(ctx, wallet)}
        </Typography>
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px]
          font-semibold uppercase tracking-wide text-neutral-400 capitalize">
          {badge}
        </span>
      </div>
      <div className="flex min-h-10 items-center">
        {isFirstPending && <Skeleton className="h-9 w-32" />}
        {!isFirstPending && serverUnavailable && (
          <Typography className="text-sm text-neutral-400">
            {translate["player.balance.server_unavailable"]()}
          </Typography>
        )}
        {!isFirstPending && !serverUnavailable && (
          <BalanceValue value={value} className="text-3xl font-semibold text-neutral-50" />
        )}
      </div>
      <Typography className="text-xs text-neutral-500">{hint}</Typography>
    </div>
  )
}, "WalletCurrency")
